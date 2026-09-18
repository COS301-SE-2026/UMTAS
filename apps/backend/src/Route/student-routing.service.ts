import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';

import { DatabaseService, type AppDatabase } from 'src/db/database.service';
import { Event, EventAttendance, EventVenue, Venue } from 'src/entities';
import { RecurringEventService } from 'src/Events/recurring-event.service';
import type { EventCriteria } from 'src/Events/dto/event.types';

import { RouteService } from './route.service';
import {
  AlternativeRoutesQueryDto,
  AlternativeRoutesResponseDto,
  AlternativeRouteDto,
  RouteEventContextDto,
  StudentRoutesQueryDto,
  StudentRoutesResponseDto,
  StudentRouteTransitionDto,
} from './dto/route.dto';

export interface StudentEventRow {
  eventId: string;
  eventName: string;
  eventCriteria: EventCriteria;
  isRecurring: boolean;
  venueId: string | null;
  buildingId: string | null;
} //END_StudentEventRow

@Injectable()
export class StudentRoutingService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly routeService: RouteService,
    private readonly recurringEventService: RecurringEventService,
  ) {}

  async getRoutesForDate(
    userId: string,
    uniId: string,
    query: StudentRoutesQueryDto,
    tx?: AppDatabase,
  ): Promise<StudentRoutesResponseDto> {
    const db = tx ?? this.databaseService.db;

    const overrideFields = [
      query.overrideOriginEventId,
      query.overrideDestinationEventId,
      query.overrideRouteIndex,
    ];

    const hasAnyOverride = overrideFields.some((value) => value !== undefined);

    const hasCompleteOverride = overrideFields.every(
      (value) => value !== undefined,
    );

    if (hasAnyOverride && !hasCompleteOverride) {
      throw new BadRequestException(
        'overrideOriginEventId, overrideDestinationEventId, and overrideRouteIndex must be provided together',
      );
    }

    //Get events for the date
    const events = await this.getStudentEventsForDate(
      userId,
      uniId,
      query.date,
      db,
    );

    //map tevents to route context
    const eventContexts = events
      .map((event) => this.toEventContext(event, query.date))
      .sort(this.compareEventContexts);

    //Build routes
    const routes: StudentRouteTransitionDto[] = [];

    for (let i = 0; i < eventContexts.length - 1; i += 1) {
      const isOverride =
        query.overrideOriginEventId === eventContexts[i].eventId &&
        query.overrideDestinationEventId === eventContexts[i + 1].eventId;

      routes.push(
        await this.buildTransition(
          uniId,
          eventContexts[i],
          eventContexts[i + 1],
          isOverride ? query.overrideRouteIndex : 0,
        ),
      );
    } //END_i

    return {
      date: query.date,
      events: eventContexts,
      routes,
    };
  } //END_getRoutesForDate

  async getAlternativeRouteBetweenEvents(
    userId: string,
    uniId: string,
    query: AlternativeRoutesQueryDto,
    tx?: AppDatabase,
  ): Promise<AlternativeRoutesResponseDto> {
    if (query.originEventId === query.destinationEventId) {
      throw new BadRequestException(
        'Origin and destination events must be different',
      );
    }

    const db = tx ?? this.databaseService.db;

    const [originEvent, destinationEvent] = await Promise.all([
      this.getStudentEventForDate(
        userId,
        uniId,
        query.originEventId,
        query.date,
        db,
      ),
      this.getStudentEventForDate(
        userId,
        uniId,
        query.destinationEventId,
        query.date,
        db,
      ),
    ]);

    const originContext = this.toEventContext(originEvent, query.date);
    const destinationContext = this.toEventContext(
      destinationEvent,
      query.date,
    );

    if (!originContext.buildingId || !destinationContext.buildingId) {
      throw new NotFoundException(
        'Both events must have venues assigned to buildings',
      );
    }

    if (originContext.buildingId === destinationContext.buildingId) {
      throw new BadRequestException(
        'Alternative routes are not available for events in the same building',
      );
    }

    const route = await this.routeService.getRouteVariant(
      uniId,
      originContext.buildingId,
      destinationContext.buildingId,
      query.routeIndex,
    );

    const alternativeRoute: AlternativeRouteDto = {
      routeIndex: query.routeIndex,
      pathCoordinates: route.pathCoordinates,
      distanceMetres: route.distanceMetres,
      isRecommended: query.routeIndex === 0,
    };

    return {
      date: query.date,
      originEventId: query.originEventId,
      destinationEventId: query.destinationEventId,
      originBuildingId: originContext.buildingId,
      destinationBuildingId: destinationContext.buildingId,
      route: alternativeRoute,
    };
  } //END_getAlternativeRouteBetweenEvents

  //🎅's little helpers

  /**
   * Builds a route transition between two events.
   *
   * @param uniId - University
   * @param originEvent - Event the student is at
   * @param destinationEvent - Event the student is going to
   * @returns The transition, or a no-route placeholder when nonapplicable.
   */
  private async buildTransition(
    uniId: string,
    originEvent: RouteEventContextDto,
    destinationEvent: RouteEventContextDto,
    routeIndex = 0,
  ): Promise<StudentRouteTransitionDto> {
    if (!originEvent.buildingId || !destinationEvent.buildingId) {
      return {
        originEvent,
        destinationEvent,
        sameBuilding: false,
        route: null,
        reason: 'One or both events have no building assigned',
      };
    }

    if (originEvent.buildingId === destinationEvent.buildingId) {
      return {
        originEvent,
        destinationEvent,
        sameBuilding: true,
        route: null,
      };
    }

    const route = await this.routeService.getRouteVariant(
      uniId,
      originEvent.buildingId,
      destinationEvent.buildingId,
      routeIndex,
    );

    return {
      originEvent,
      destinationEvent,
      sameBuilding: false,
      route,
    };
  } //END_buildTransistion

  /**
   * Fetches all student events for a specific date.
   *
   * @param userId - Student's user ID
   * @param uniId - University to scope the query to
   * @param date - Date the events occur on
   * @param tx - transaction
   * @returns Deduplicated event rows occurring on the date.
   */
  private async getStudentEventsForDate(
    userId: string,
    uniId: string,
    date: string,
    tx: AppDatabase,
  ): Promise<StudentEventRow[]> {
    const rows = await tx
      .select({
        eventId: Event.eventID,
        eventName: Event.eventName,
        eventCriteria: Event.eventCriteria,
        isRecurring: Event.isRecurring,
        venueId: Venue.VenueID,
        buildingId: Venue.BuildingID,
      })
      .from(EventAttendance)
      .innerJoin(Event, eq(Event.eventID, EventAttendance.eventID))
      .leftJoin(EventVenue, eq(EventVenue.EventID, Event.eventID))
      .leftJoin(Venue, eq(Venue.VenueID, EventVenue.VenueID))
      .where(
        and(
          eq(EventAttendance.UserID, userId),
          eq(EventAttendance.eventDate, date),
          eq(EventAttendance.state, 'ATTENDING'),
          eq(Venue.UniversityID, uniId),
        ),
      )
      .orderBy(asc(EventVenue.VenueID));

    return this.selectFirstVenuePerEvent(
      rows.map((row) => ({
        eventId: row.eventId,
        eventName: row.eventName,
        eventCriteria: row.eventCriteria,
        isRecurring: row.isRecurring,
        venueId: row.venueId,
        buildingId: row.buildingId,
      })),
      date,
    );
  } //END_getStudentEventsForDate

  /**
   * Fetches a single student event for a specific date.
   *
   * @param userId - Student's user ID
   * @param uniId - University to scope the query to
   * @param eventId - Event to fetch
   * @param date - Date the event occurs on
   * @param tx - transaction
   * @returns The event row.
   * @throws NotFoundException when the event is not attended on the date.
   */
  private async getStudentEventForDate(
    userId: string,
    uniId: string,
    eventId: string,
    date: string,
    tx: AppDatabase,
  ): Promise<StudentEventRow> {
    const events = await tx
      .select({
        eventId: Event.eventID,
        eventName: Event.eventName,
        eventCriteria: Event.eventCriteria,
        isRecurring: Event.isRecurring,
        venueId: Venue.VenueID,
        buildingId: Venue.BuildingID,
      })
      .from(EventAttendance)
      .innerJoin(Event, eq(Event.eventID, EventAttendance.eventID))
      .leftJoin(EventVenue, eq(EventVenue.EventID, Event.eventID))
      .leftJoin(Venue, eq(Venue.VenueID, EventVenue.VenueID))
      .where(
        and(
          eq(EventAttendance.UserID, userId),
          eq(EventAttendance.eventID, eventId),
          eq(EventAttendance.eventDate, date),
          eq(EventAttendance.state, 'ATTENDING'),
          eq(Venue.UniversityID, uniId),
        ),
      )
      .orderBy(asc(EventVenue.VenueID));

    const [event] = this.selectFirstVenuePerEvent(
      events.map((row) => ({
        eventId: row.eventId,
        eventName: row.eventName,
        eventCriteria: row.eventCriteria,
        isRecurring: row.isRecurring,
        venueId: row.venueId,
        buildingId: row.buildingId,
      })),
      date,
    );

    if (!event) {
      throw new NotFoundException(
        `Event[${eventId}] is not attended on ${date}`,
      );
    }

    return event;
  } //END_getStudentEventForDate

  /**
   * Filters events to those occurring on the requested date, keeping one per event ID.
   *
   * @param events - Student event rows to filter
   * @param requestedDate - Date to check occurrence against
   * @returns Events that occur on the date, deduplicated by event ID
   */
  private selectFirstVenuePerEvent(
    events: StudentEventRow[],
    requestedDate: string,
  ): StudentEventRow[] {
    const eventsById = new Map<string, StudentEventRow>();

    for (const event of events) {
      const occursOnDate = this.recurringEventService.occursOnDate(
        {
          eventId: event.eventId,
          eventCriteria: event.eventCriteria,
          isRecurring: event.isRecurring,
        },
        requestedDate,
      );

      if (!occursOnDate) {
        continue;
      }

      if (!eventsById.has(event.eventId)) {
        eventsById.set(event.eventId, event);
      }
    } //END_event

    return [...eventsById.values()];
  } //END_selectFirstVenuePerEvent

  /**
   * Maps a student event row to a route event context
   *
   * @param event - Student event row to map
   * @param occurrenceDate - Date of the occurrence to attach
   * @returns The route event context
   */
  private toEventContext(
    event: StudentEventRow,
    occurrenceDate: string,
  ): RouteEventContextDto {
    return {
      eventId: event.eventId,
      eventName: event.eventName,
      occurrenceDate,
      startTime: event.eventCriteria.startTime,
      endTime: event.eventCriteria.endTime,
      venueId: event.venueId,
      buildingId: event.buildingId,
    };
  } //END_toEventContext

  /**
   * Compares two event contexts for sorting
   *
   * Orders by startTime, then by eventId.
   *
   * @param l - Left
   * @param r - Right
   * @returns Negative if l sorts first, positive if r sorts first, 0 if equal
   */
  private compareEventContexts(
    l: RouteEventContextDto,
    r: RouteEventContextDto,
  ): number {
    const startTimeComparison = l.startTime.localeCompare(r.startTime);

    if (startTimeComparison !== 0) {
      return startTimeComparison;
    }

    return l.eventId.localeCompare(r.eventId);
  } //END_compareEventContexts
} //END_StudentRoutingService
