import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService, type AppDatabase } from '../db/database.service';
import {
  AttendanceOperatorPreference,
  type AttendanceOperatorPreferenceEntity,
} from '../entities';

@Injectable()
export class AttendancePreferenceService {
  constructor(private readonly dbService: DatabaseService) {}

  async getPreference(
    ownerUserId: string,
    universityId: string,
    tx: AppDatabase = this.dbService.db,
  ): Promise<AttendanceOperatorPreferenceEntity | null> {
    const [preference] = await tx
      .select()
      .from(AttendanceOperatorPreference)
      .where(
        and(
          eq(AttendanceOperatorPreference.ownerUserId, ownerUserId),
          eq(AttendanceOperatorPreference.universityId, universityId),
        ),
      )
      .limit(1);
    return preference ?? null;
  }

  async setPreferredEvent(
    ownerUserId: string,
    universityId: string,
    preferredEventId: string,
    tx: AppDatabase = this.dbService.db,
  ): Promise<AttendanceOperatorPreferenceEntity> {
    const now = new Date();
    const [preference] = await tx
      .insert(AttendanceOperatorPreference)
      .values({
        ownerUserId,
        universityId,
        preferredEventId,
        selectedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          AttendanceOperatorPreference.ownerUserId,
          AttendanceOperatorPreference.universityId,
        ],
        set: { preferredEventId, selectedAt: now, updatedAt: now },
      })
      .returning();
    if (!preference) {
      throw new InternalServerErrorException(
        'Failed to save attendance event preference',
      );
    }
    return preference;
  }

  async clearPreference(
    ownerUserId: string,
    universityId: string,
    tx: AppDatabase = this.dbService.db,
  ): Promise<void> {
    await tx
      .delete(AttendanceOperatorPreference)
      .where(
        and(
          eq(AttendanceOperatorPreference.ownerUserId, ownerUserId),
          eq(AttendanceOperatorPreference.universityId, universityId),
        ),
      );
  }
}
