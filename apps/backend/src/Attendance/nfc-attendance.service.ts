import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { eq } from 'drizzle-orm';
import { DatabaseService, type AppDatabase } from '../db/database.service';
import { NfcTag, type NfcTagEntity } from '../entities';
import type { AttendanceActor } from './attendance-session.service';
import type {
  NfcCheckInDto,
  NfcTagRegistrationResponseDto,
  NfcTagTestResponseDto,
  RegisteredNfcTagDto,
} from './dto/nfc-attendance.dto';

const REGISTRATION_LIFETIME_MS = 10 * 60_000;

interface RegistrationTicket {
  ownerUserId: string;
  universityId: string;
  tagId: string;
  tokenHash: string;
  expiresAt: number;
}

@Injectable()
export class NfcAttendanceService {
  constructor(private readonly dbService: DatabaseService) {}

  async getRegisteredTag(
    actor: AttendanceActor,
  ): Promise<RegisteredNfcTagDto | null> {
    this.assertOperator(actor);
    const [tag] = await this.dbService.db
      .select()
      .from(NfcTag)
      .where(eq(NfcTag.ownerUserId, actor.userId))
      .limit(1);
    return tag ? this.toRegisteredTag(tag) : null;
  }

  prepareRegistration(actor: AttendanceActor): NfcTagRegistrationResponseDto {
    this.assertOperator(actor);
    if (!actor.uniId) {
      throw new ForbiddenException(
        'Select a university before registering a sticker',
      );
    }
    const tagId = randomUUID();
    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);
    const expiresAt = Date.now() + REGISTRATION_LIFETIME_MS;
    const payload: RegistrationTicket = {
      ownerUserId: actor.userId,
      universityId: actor.uniId,
      tagId,
      tokenHash,
      expiresAt,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signature = createHmac('sha256', this.authSecret())
      .update(encodedPayload)
      .digest('base64url');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';
    const tagUrl = new URL('/attendance/check-in', appUrl);
    tagUrl.searchParams.set('tagId', tagId);
    tagUrl.searchParams.set('token', token);
    return {
      tagId,
      token,
      tagUrl: tagUrl.toString(),
      activationTicket: `${encodedPayload}.${signature}`,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  async confirmRegistration(
    actor: AttendanceActor,
    activationTicket: string,
    tx?: AppDatabase,
  ): Promise<RegisteredNfcTagDto> {
    this.assertOperator(actor);
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.confirmRegistration(actor, activationTicket, transaction),
      );
    }
    const payload = this.verifyRegistrationTicket(activationTicket);
    if (
      payload.ownerUserId !== actor.userId ||
      payload.universityId !== actor.uniId
    ) {
      throw new ForbiddenException(
        'This sticker registration belongs to another operator',
      );
    }
    const now = new Date();
    const [tag] = await tx
      .insert(NfcTag)
      .values({
        tagId: payload.tagId,
        ownerUserId: actor.userId,
        universityId: payload.universityId,
        tokenHash: payload.tokenHash,
        registeredAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: NfcTag.ownerUserId,
        set: {
          tagId: payload.tagId,
          universityId: payload.universityId,
          tokenHash: payload.tokenHash,
          registeredAt: now,
          updatedAt: now,
        },
      })
      .returning();
    if (!tag)
      throw new InternalServerErrorException('Failed to register NFC sticker');
    return this.toRegisteredTag(tag);
  }

  async testRegisteredTag(
    actor: AttendanceActor,
    dto: NfcCheckInDto,
  ): Promise<NfcTagTestResponseDto> {
    this.assertOperator(actor);
    const tag = await this.authenticateTag(dto);
    if (
      !tag ||
      tag.ownerUserId !== actor.userId ||
      tag.universityId !== actor.uniId
    ) {
      return {
        valid: false,
        message: 'This is not your currently registered NFC sticker.',
      };
    }
    return {
      valid: true,
      message: 'Tag read successfully. No attendance was recorded.',
      displayId: this.displayId(tag.tagId),
    };
  }

  async authenticateTag(
    dto: NfcCheckInDto,
    tx: AppDatabase = this.dbService.db,
  ): Promise<NfcTagEntity | null> {
    const [tag] = await tx
      .select()
      .from(NfcTag)
      .where(eq(NfcTag.tagId, dto.tagId))
      .limit(1);
    return tag && this.matchesToken(dto.token, tag.tokenHash) ? tag : null;
  }

  async getTagByOwner(
    ownerUserId: string,
    tx: AppDatabase = this.dbService.db,
  ): Promise<NfcTagEntity | null> {
    const [tag] = await tx
      .select()
      .from(NfcTag)
      .where(eq(NfcTag.ownerUserId, ownerUserId))
      .limit(1);
    return tag ?? null;
  }

  private assertOperator(actor: AttendanceActor): void {
    if (actor.uniRole !== 'lecturer' && actor.uniRole !== 'uni_admin') {
      throw new ForbiddenException(
        'Only lecturers and university admins may manage NFC stickers',
      );
    }
  }

  private authSecret(): string {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) {
      throw new InternalServerErrorException(
        'NFC registration signing requires BETTER_AUTH_SECRET',
      );
    }
    return secret;
  }

  private hashToken(token: string): string {
    return createHmac('sha256', this.authSecret()).update(token).digest('hex');
  }

  private matchesToken(token: string, expectedHash: string): boolean {
    const supplied = Buffer.from(this.hashToken(token), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    return (
      supplied.length === expected.length && timingSafeEqual(supplied, expected)
    );
  }

  private verifyRegistrationTicket(ticket: string): RegistrationTicket {
    const [encodedPayload, suppliedSignature, extra] = ticket.split('.');
    if (!encodedPayload || !suppliedSignature || extra) {
      throw new BadRequestException('Invalid sticker registration ticket');
    }
    const expectedSignature = createHmac('sha256', this.authSecret())
      .update(encodedPayload)
      .digest();
    let actualSignature: Buffer;
    try {
      actualSignature = Buffer.from(suppliedSignature, 'base64url');
    } catch {
      throw new BadRequestException('Invalid sticker registration ticket');
    }
    if (
      actualSignature.length !== expectedSignature.length ||
      !timingSafeEqual(actualSignature, expectedSignature)
    ) {
      throw new BadRequestException('Invalid sticker registration ticket');
    }
    let payload: RegistrationTicket;
    try {
      payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as RegistrationTicket;
    } catch {
      throw new BadRequestException('Invalid sticker registration ticket');
    }
    if (
      !payload.ownerUserId ||
      !payload.universityId ||
      !payload.tagId ||
      !/^[a-f0-9]{64}$/.test(payload.tokenHash) ||
      !Number.isFinite(payload.expiresAt) ||
      Date.now() >= payload.expiresAt
    ) {
      throw new BadRequestException('This sticker registration has expired');
    }
    return payload;
  }

  private toRegisteredTag(tag: NfcTagEntity): RegisteredNfcTagDto {
    return {
      tagId: tag.tagId,
      displayId: this.displayId(tag.tagId),
      registeredAt: tag.registeredAt,
    };
  }

  private displayId(tagId: string): string {
    return `…${tagId.slice(-6).toUpperCase()}`;
  }
}
