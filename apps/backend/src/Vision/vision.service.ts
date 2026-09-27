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
  DeleteVisionSessionResponseDto,
  SessionInferenceResult,
  UpdateVisionSessionDto,
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

  async update(
    sessionId: string,
    dto: UpdateVisionSessionDto,
    tx?: AppDatabase,
  ): Promise<VisionSessionSingleResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.update(sessionId, dto, t);
      });
    } //END_transaction

    //Validate session exists - throws 404
    const existingSession = (await this.getById(sessionId, tx)).session;

    const updateValues = await this.validateUpdateInput(
      existingSession,
      dto,
      tx,
    );

    //nothing to update -> return early
    if (Object.keys(updateValues).length === 0) {
      this.OOPSIE.log(`Nothing to update for session[${sessionId}]`);
      return {
        session: existingSession,
        message: `Nothing to update for session`,
      };
    }

    const [updatedSession] = await tx
      .update(VisionSession)
      .set(updateValues)
      .where(eq(VisionSession.SessionID, sessionId))
      .returning();

    if (!updatedSession) {
      this.OOPSIE.fatal(`Failed to update vision session [${sessionId}]`);
      throw new InternalServerErrorException(
        'Vision session failed to be updated',
      );
    }

    return {
      session: visionSessionDtoAdapter(updatedSession),
      message: 'Vision session updated successfully',
    };
  } //END_update

  async delete(
    sessionId: string,
    tx?: AppDatabase,
  ): Promise<DeleteVisionSessionResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.delete(sessionId, t);
      });
    } //END_transaction

    const [deletedSession] = await tx
      .delete(VisionSession)
      .where(eq(VisionSession.SessionID, sessionId))
      .returning();

    if (!deletedSession) {
      this.OOPSIE.warn(`Vision session not found for deletion [${sessionId}]`);
      throw new NotFoundException(`Vision session not found.`);
    }

    return {
      SessionID: deletedSession.SessionID,
      SessionName: deletedSession.SessionName,
      success: true,
    };
  } //END_delete

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
    this.validateDate(input.Date);

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

  /**
   * Validates and normalises a vision session update
   *
   * @param existingSession - Existing session
   * @param input - Update input
   * @param tx - transaction
   * @returns Normalised update values
   */
  private async validateUpdateInput(
    existingSession: VisionSessionDto,
    input: UpdateVisionSessionDto,
    tx: AppDatabase,
  ): Promise<UpdateVisionSessionDto> {
    const validated: UpdateVisionSessionDto = {};

    //SessinoName
    const sessionName =
      input.SessionName !== undefined
        ? input.SessionName.trim()
        : existingSession.SessionName;

    if (input.SessionName !== undefined) {
      if (sessionName.length === 0)
        throw new BadRequestException('SessionName cannot be empty');

      validated.SessionName = sessionName;
    }

    //Description
    if (input.SessionDsc !== undefined)
      validated.SessionDsc = input.SessionDsc?.trim() ?? null;

    //Data
    if (input.Data !== undefined)
      validated.Data = copyInferenceData(input.Data);

    //Event
    const eventId =
      input.EventID !== undefined ? input.EventID : existingSession.EventID;

    if (input.EventID !== undefined) {
      if (eventId)
        await this.validateEventBelongsToModule(
          eventId,
          existingSession.ModuleID,
          tx,
        );

      validated.EventID = eventId;
    }

    //Date
    const sessionDate = input.Date ?? existingSession.Date;
    if (input.Date !== undefined) {
      this.validateDate(input.Date);
      validated.Date = input.Date;
    }

    //If name changed or date - validate duplicates
    const sessionIdentityChanged =
      sessionName !== existingSession.SessionName ||
      sessionDate !== existingSession.Date;

    if (sessionIdentityChanged) {
      const duplicateSession = await this.findDuplicateSession(
        existingSession.ModuleID,
        sessionName,
        sessionDate,
        tx,
      );

      if (
        duplicateSession &&
        duplicateSession.sessionId !== existingSession.SessionID
      ) {
        this.OOPSIE.warn(
          `Vision session name/date conflict for module[${existingSession.ModuleID}]`,
        );

        throw new ConflictException(
          'A vision session with that name already exists for module on specified date',
        );
      }
    }

    return validated;
  } //END_validateUpdateInput

  /**
   * Validates a vision session date is a valid calendar date in the future or today.
   *
   * @param date - Date string to validate.
   * @throws BadRequestException when the date is invalid or in the past.
   */
  private validateDate(date: string): void {
    const sessionDate = new Date(date);

    if (Number.isNaN(sessionDate.getTime()))
      throw new BadRequestException('Invalid vision session date');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (sessionDate < today) {
      this.OOPSIE.warn(
        `Cannot update vision session with a past date [${date}]`,
      );
      throw new BadRequestException(
        'Vision session date cannot be in the past',
      );
    }
  } //END_validateDate
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
