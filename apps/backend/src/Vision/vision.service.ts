import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppDatabase, DatabaseService } from 'src/db/database.service';

//Dtos
import { and, desc, eq, gte, ilike, lte, SQL } from 'drizzle-orm';
import { Event, UniversityEvent, VisionSession } from 'src/entities';
import { ModuleServiceV2 } from 'src/Module/moduleV2.service';
import {
  CreateVisionSessionInput,
  SessionInferenceResult,
  VisionSessionDto,
  VisionSessionListResponseDto,
  VisionSessionQueryDto,
  VisionSessionSingleResponseDto,
} from './dto';

//Vision entity
type VisionSessionEntity = typeof VisionSession.$inferSelect;

@Injectable()
export class VisionService {
  private readonly OOPSIE = new Logger(this.constructor.name);

  constructor(
    private readonly dbService: DatabaseService,
    private readonly moduleService: ModuleServiceV2,
  ) {}

  async create(
    dto: CreateVisionSessionInput,
    tx?: AppDatabase,
  ): Promise<VisionSessionSingleResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.create(dto, t);
      });
    } //END_transaction

    const {
      ModuleID: moduleId,
      EventID: eventId,
      Date: date,
      SessionName: sessionName,
      SessionDsc: sessionDsc,
      Data: data,
      CreatedBy: createdBy,
    } = await this.validateCreateInput(dto, tx);

    const [session] = await tx
      .insert(VisionSession)
      .values({
        ModuleID: moduleId,
        EventID: eventId,
        Date: date,
        SessionName: sessionName,
        SessionDsc: sessionDsc,
        Data: copyInferenceData(data),
        CreatedBy: createdBy,
      })
      .returning();

    if (!session) {
      this.OOPSIE.fatal(
        `Failed to insert new session for input: [${JSON.stringify(dto)}]`,
      );
      throw new InternalServerErrorException(
        'Vision session failed to be created',
      );
    }

    return {
      session: visionSessionDtoAdapter(session),
      message: 'Vision session created successfully',
    };
  } //END_create

  async getById(
    sessionId: string,
    tx?: AppDatabase,
  ): Promise<VisionSessionSingleResponseDto> {
    const db = tx ?? this.dbService.db;

    const [session] = await db
      .select()
      .from(VisionSession)
      .where(eq(VisionSession.SessionID, sessionId))
      .limit(1);

    if (!session) {
      this.OOPSIE.warn(`Vision session not found for [${sessionId}]`);
      throw new NotFoundException(`Vision session not found`);
    }

    return {
      session: visionSessionDtoAdapter(session),
    };
  } //END_getById

  async getAll(
    query: VisionSessionQueryDto,
    tx?: AppDatabase,
  ): Promise<VisionSessionListResponseDto> {
    const db = tx ?? this.dbService.db;

    const conditions: SQL[] = [];

    //Module
    if (query.moduleId)
      conditions.push(eq(VisionSession.ModuleID, query.moduleId));

    //Event
    if (query.eventId)
      conditions.push(eq(VisionSession.EventID, query.eventId));

    //From date
    if (query.from) conditions.push(gte(VisionSession.Date, query.from));

    //To date
    if (query.to) conditions.push(lte(VisionSession.Date, query.to));

    //Name search
    if (query.search)
      conditions.push(
        ilike(VisionSession.SessionName, `%${query.search.trim()}%`),
      );

    const sessions = await db
      .select()
      .from(VisionSession)
      .where(and(...conditions))
      .orderBy(desc(VisionSession.Date), VisionSession.SessionName);

    return {
      sessions: sessions.map((s) => visionSessionDtoAdapter(s)),
    };
  } //END_getAll

  //🎅's little helpers

  /**
   * Validates and normalises a vision session create input.
   *
   * @param input - Create input to validate
   * @param tx - transaction
   * @returns The normalised input
   * @throws NotFoundException when the module or event lookup fails
   * @throws BadRequestException when the session date is in the past
   * @throws ConflictException when a session with the same name exists on the date
   */
  private async validateCreateInput(
    input: CreateVisionSessionInput,
    tx: AppDatabase,
  ): Promise<CreateVisionSessionInput> {
    //Description
    input.SessionDsc = input.SessionDsc?.trim() ?? null;

    //ModuleID
    const moduleId = input.ModuleID;
    await this.moduleService.getByIdV2({ moduleId, tx });

    //EventID
    const eventId = input.EventID;
    if (eventId) await this.validateEventBelongsToModule(eventId, moduleId, tx);

    // Date
    const sessionDate = new Date(input.Date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (sessionDate < today) {
      //Cannot be date in past
      this.OOPSIE.warn(
        `Cannot create vision session in the past [${input.Date}]`,
      );
      throw new BadRequestException(
        `Vision session date cannot be in the past`,
      );
    }

    //Session Name
    const sessionName = input.SessionName.trim();

    //Ensure no duplicate session name for this date
    const duplicateSession = await this.findDuplicateSession(
      moduleId,
      sessionName,
      input.Date,
      tx,
    );

    if (duplicateSession) {
      this.OOPSIE.warn(
        `Session with name [${sessionName}] already exists for module[${moduleId}] on date[${input.Date}]`,
      );
      throw new ConflictException(
        `A vision session with that name already exists for module on specified date`,
      );
    }

    return input;
  } //END_validateCreateInput

  /**
   * Ensures an event exists and belongs to the given module.
   *
   * @param eventId - Event to validate
   * @param moduleId - Module the event belongs to
   * @param tx - transaction
   * @throws NotFoundException when the event does not belong to the module
   */
  private async validateEventBelongsToModule(
    eventId: string,
    moduleId: string,
    tx: AppDatabase,
  ): Promise<void> {
    const [event] = await tx
      .select({
        eventId: Event.eventID,
      })
      .from(Event)
      .innerJoin(UniversityEvent, eq(UniversityEvent.eventID, Event.eventID))
      .where(
        and(eq(Event.eventID, eventId), eq(UniversityEvent.moduleID, moduleId)),
      )
      .limit(1);

    if (!event) {
      this.OOPSIE.warn(
        `Event[${eventId}] does not belong to module[${moduleId}]`,
      );
      throw new NotFoundException(
        `Event[${eventId}] does not belong to Module[${moduleId}]`,
      );
    }
  } //END_validateeventBelongsToModule

  /**
   * Finds an existing session with the same module, name, and date.
   *
   * @param moduleId - Module the session belongs to
   * @param sessionName - Session name to match
   * @param date - Session date to match
   * @param tx - transaction
   * @returns The matching session's ID, or undefined when none existent
   */
  private async findDuplicateSession(
    moduleId: string,
    sessionName: string,
    date: string,
    tx: AppDatabase,
  ): Promise<{ sessionId: string } | undefined> {
    const [session] = await tx
      .select({
        sessionId: VisionSession.SessionID,
      })
      .from(VisionSession)
      .where(
        and(
          eq(VisionSession.ModuleID, moduleId),
          eq(VisionSession.SessionName, sessionName),
          eq(VisionSession.Date, date),
        ),
      )
      .limit(1);

    return session;
  } //END_findDuplicateSession
} //END_VisionService

function copyInferenceData(
  data: SessionInferenceResult,
): SessionInferenceResult {
  return {
    questions_asked: data.questions_asked,
    total_restless_frames: data.total_restless_frames,
    total_stable_frames: data.total_stable_frames,
    total_paying_attention: data.total_paying_attention,
    total_no_attention: data.total_no_attention,
    total_frames: data.total_frames,
  };
} //END_copyInferenceData

function visionSessionDtoAdapter(row: VisionSessionEntity): VisionSessionDto {
  return {
    SessionID: row.SessionID,
    ModuleID: row.ModuleID,
    EventID: row.EventID,
    Date: row.Date,
    SessionName: row.SessionName,
    SessionDsc: row.SessionDsc,
    Data: copyInferenceData(row.Data),
    CreatedBy: row.CreatedBy,
    CreatedAt: row.CreatedAt.toISOString(),
  };
} //END_visionSessionDtoAdapter
