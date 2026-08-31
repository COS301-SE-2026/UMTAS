import { DatabaseService } from 'src/db/database.service';
import { EventService } from './event.service';
import { EventImportFingerprintService } from './event-import-fingerprint.service';
import { UniversityService } from 'src/University/university.service';
import {
  BadRequestException,
  forwardRef,
  Inject,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ModuleServiceV2 } from 'src/Module/moduleV2.service';
import {
  CreateEventDtoV2,
  EventCriteriaDto,
  EventCriteriaDtoV2,
  EventSingleResponseDto,
  ValidateEventResponseDto,
  VenueDto,
} from './dto/EventDto.dto';
import { AppDatabase } from 'src/auth/auth';
import { Event, UniversityEvent, Venue } from 'src/entities';
import { UniversitySingleResponseDto } from 'src/University/dto/university.dto';
import { DayOfWeek } from './dto/event.types';
import { and, eq, inArray } from 'drizzle-orm';

export class EventServiceV2 extends EventService {
  private readonly OOPSIE = new Logger(this.constructor.name);

  constructor(
    protected readonly dbService: DatabaseService,
    protected readonly eventImportFingerprintService: EventImportFingerprintService,
    protected readonly uniService: UniversityService,
    @Inject(forwardRef(() => ModuleServiceV2))
    protected readonly moduleService: ModuleServiceV2,
  ) {
    super(dbService, eventImportFingerprintService, uniService, moduleService);
  } //END_constr

  //Create V2
  /**
   * Create Event - Version 2
   * @description For Lecturers and University Admins to create events for modules
   *
   * @param dto CreateEventDto
   * @param tx Transactional safety
   *
   * @note moduleId is required
   */
  async createV2(
    dto: CreateEventDtoV2,
    userId: string,
    uniId?: string,
    tx?: AppDatabase,
  ): Promise<EventSingleResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.createV2(dto, userId, uniId, t);
      }); //END_transaction
    }

    //Validate University
    const university =
      uniId !== undefined && uniId.trim().length !== 0
        ? await this.uniService.getById(uniId)
        : null;

    if (university === null)
      throw new BadRequestException(
        `University[${uniId}] from your session data is invalid.`,
      );

    //Validate DTO
    dto = await this.validateCreateEventDto(tx, university, dto);

    const moduleId = dto.eventCriteria.moduleId;

    //Create Event
    const event = (await this.createEventV2(tx, dto)).event;

    //Create university Event entry
    //Check if entity already exists
    const [existing] = await tx
      .select()
      .from(UniversityEvent)
      .where(
        and(
          eq(UniversityEvent.moduleID, moduleId),
          eq(UniversityEvent.eventID, event.eventId),
        ),
      )
      .limit(1);

    if (!existing) {
      const [uniEvent] = await tx
        .insert(UniversityEvent)
        .values({
          moduleID: moduleId,
          eventID: event.eventId,
        })
        .returning();

      if (!uniEvent)
        throw new InternalServerErrorException(
          `Failed to create UniversityEvent entry`,
        );
    } //END_!existing

    const venueIds: string[] | undefined = event.venues?.map(
      (venue) => venue.venueId,
    );
    if (venueIds !== undefined)
      await this.insertEventVenues(tx, event.eventId, venueIds);

    return { event };
  } //END_CreateV2

  /**
   * Validate an event
   * @param eventId - ID of event to validate
   * @param validated - Update validated status to this param - Optional - default opposite
   * @returns Updated event together with message
   */
  async validateEvent(
    eventId: string,
    validated?: boolean,
  ): Promise<ValidateEventResponseDto> {
    const tx = this.dbService.db;

    //Check if event exists - will throw
    const event = (await this.getById(eventId, tx)).event;

    //Update event to validated
    const [updated] = await this.dbService.db
      .update(Event)
      .set({
        validated: validated ?? !event.validated,
      })
      .where(eq(Event.eventID, eventId))
      .returning();

    return {
      event: await this.mapEventToDto(updated),
      message: `Event[${updated.eventName}] validated=${updated.validated}`,
    };
  } //END_validateEvent

  //🎅's little helpers

  //Create simple event - V2
  private async createEventV2(
    tx: AppDatabase,
    dto: CreateEventDtoV2,
  ): Promise<EventSingleResponseDto> {
    const eventName = dto.eventName ?? `nothing`;
    const activityCode = dto.activityCode!;
    const eventCriteria = dto.eventCriteria as EventCriteriaDto;
    const isRec = dto.isRecurring;

    const fingerprint = this.eventImportFingerprintService.buildForEvent({
      eventName: dto.eventName,
      activityType: dto.activityType,
      activityCode,
      eventCriteria: eventCriteria,
    });

    if (!fingerprint) {
      this.OOPSIE.warn(
        `Failed to create eventImportFingerprintService[${fingerprint}]`,
      );
      throw new InternalServerErrorException(
        `Failed to create eventImportFingerprintService[${fingerprint}].`,
      );
    } //END_fingerprint

    const [existing] = await tx
      .select()
      .from(Event)
      .where(eq(Event.importFingerprint, fingerprint))
      .limit(1);

    if (existing) {
      this.OOPSIE.log(`Existing Event[${existing.eventName}] returned.`);
      return { event: await this.mapEventToDto(existing, tx) };
    }

    const [event] = await tx
      .insert(Event)
      .values({
        eventName: eventName,
        activityCode,
        activityType: dto.activityType ?? null,
        eventCriteria: eventCriteria,
        isRecurring: isRec,
        validated: dto.validated ?? true,
        importFingerprint: fingerprint,
        createdAt: new Date(),
      })
      .returning();

    if (!event)
      throw new InternalServerErrorException(`Failed to create event`);

    return { event: await this.mapEventToDto(event) };
  } //END_createEventV2

  protected async validateCreateEventDto(
    tx: AppDatabase,
    uni: UniversitySingleResponseDto,
    dto: CreateEventDtoV2,
  ): Promise<CreateEventDtoV2> {
    const validated: CreateEventDtoV2 = dto;

    //Validate isRecurring - default to false
    validated.isRecurring = validated.isRecurring
      ? validated.isRecurring
      : false;
    //END_isRecurring

    //Validate activityType - default lecture
    validated.activityType = validated.activityType
      ? (validated.activityType.trim() as typeof validated.activityType)
      : 'lecture';
    //END_activityType

    //Validate EventCode - default lec
    validated.activityCode = validated.activityCode
      ? validated.activityCode.trim()
      : 'lec';
    //END_EventCode

    //Validate EventName
    if (!validated.eventName || validated?.eventName.length === 0) {
      validated.eventName = `Event_${validated.activityCode}`;
    }
    //END_EventName

    //Validate validated
    validated.validated = validated.validated ?? false;
    //END_validated

    //Validate eventCriteria
    validated.eventCriteria = await this.validateEventCriteria(
      validated.eventCriteria,
      validated.isRecurring,
    );

    if (validated.venues && validated.venues.length !== 0)
      validated.venues = await this.validateVenues(
        tx,
        uni.UniversityID,
        validated.venues,
      );

    return validated;
  } //END_validateCreateEventDto

  /**Validate EventCriteria - EventCriteriaDtoV2
   *
   * @param eventCriteria - Validate
   * @param isRecurring - Recurring event
   */
  protected async validateEventCriteria(
    eventCriteria: EventCriteriaDtoV2,
    isRecurring: boolean,
  ): Promise<EventCriteriaDtoV2> {
    const v: EventCriteriaDtoV2 = eventCriteria;

    //Validate Times
    [v.startTime, v.endTime] = this.validateStartAndEndTime(
      v.startTime,
      v.endTime,
    );

    //Validate Module - Required
    const moduleId = eventCriteria.moduleId;
    const module =
      moduleId !== undefined && moduleId.trim().length !== 0
        ? await this.moduleService.getByIdV2({ moduleId })
        : null;

    if (module === null) {
      this.OOPSIE.warn(`ModuleID invalid`);
      throw new BadRequestException(`moduleId[${moduleId}] is invalid`);
    }
    //END_Validate Module

    //Validate Day_Of_Week and date based of isRecurring
    if (isRecurring) {
      //true
      v.dayOfWeek =
        v.dayOfWeek ??
        (new Date()
          .toLocaleDateString('en-US', { weekday: 'long' })
          .toLocaleLowerCase() as DayOfWeek);
    } else {
      //false
      v.date = v.date ?? new Date().toISOString().split('T')[0];
    }

    return v;
  } //END_validateEventCriteria

  /**Validate the Start and End times
   * @param start - Start time - Optional - Default 07:30
   * @param end - End time - Optional - Default 08:20 | 60min after start
   *
   * @throws BadRequestException - Invalid time format/value
   */
  private validateStartAndEndTime(
    start?: string,
    end?: string,
  ): [string, string] {
    const parse = (s: string) => {
      //Format
      if (!/^\d{1,2}:\d{2}$/.test(s))
        throw new BadRequestException(`Invalid time format: ${s}`);

      //Value
      const [hs, ms] = s.split(':');
      const h = Number(hs);
      const m = Number(ms);

      if (
        !Number.isInteger(h) ||
        !Number.isInteger(m) ||
        h < 0 ||
        h > 23 ||
        m < 0 ||
        m > 59
      ) {
        throw new BadRequestException(`Invalid time value: ${s} | hour/minute`);
      }

      return h * 60 + m;
    };

    const format = (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;

      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    //Default
    start = start ?? `07:30`;
    end = end ?? `08:20`;

    //End after start
    const startIndex = parse(start);
    let endIndex = parse(end);

    if (endIndex <= startIndex) endIndex = startIndex + 60;

    return [format(startIndex), format(endIndex)];
  } //END_validateStartAndEndTime

  /** Validate Venues
   *
   * @param universityId - which university owns the venues
   * @param venues - The venues - Optional
   *
   * return [] if none
   */
  protected async validateVenues(
    tx: AppDatabase,
    universityId: string,
    venues?: VenueDto[],
  ): Promise<VenueDto[]> {
    const venueIds = await this.validateVenueIds(tx, venues, universityId);

    if (venueIds.length === 0) return [];

    //Fetch clean venues according to id's
    const rows = await tx
      .select({
        venueId: Venue.VenueID,
        venueName: Venue.VenueName,
      })
      .from(Venue)
      .where(inArray(Venue.VenueID, venueIds));

    const fresh = rows.map((r) => ({
      venueId: r.venueId,
      venueName: r.venueName ?? 'noNameVenue',
    }));

    return fresh;
  } //END_validateVenues
} //END_EventServiceV2
