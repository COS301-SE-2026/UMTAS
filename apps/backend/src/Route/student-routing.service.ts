import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';

import { DatabaseService, type AppDatabase } from 'src/db/database.service';
import { Event, EventAttendance, EventVenue, Venue } from 'src/entities';
import type { EventCriteria } from 'src/Events/dto/event.types';

import {
  AlternativeRouteDto,
  AlternativeRoutesQueryDto,
  AlternativeRoutesResponseDto,
  RouteEventContextDto,
  StudentRoutesQueryDto,
  StudentRoutesResponseDto,
  StudentRouteTransitionDto,
} from './dto/';
import { RouteHelperService } from './route.helper.service';
import { RouteService } from './route.service';

export interface StudentEventRow {
  eventId: string;
  eventName: string;
  eventCriteria: EventCriteria;
  isRecurring: boolean;
  venueId: string | null;
  buildingId: string | null;
} //END_StudentEventRow

export interface BuildTransitionOptions {
  uniId: string;
  originEvent: RouteEventContextDto;
  destinationEvent: RouteEventContextDto;
  routeIndex?: number;
  tx: AppDatabase;
} //END_BuildTransitionOptions

@Injectable()
export class StudentRoutingService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly routeService: RouteService,
    private readonly routeHelperService: RouteHelperService,
  ) {}

  async getRoutesForDate(
    userId: string,
    uniId: string,
    query: StudentRoutesQueryDto,
    tx?: AppDatabase,
  ): Promise<StudentRoutesResponseDto> {
    const db = tx ?? this.databaseService.db;

    //Get events for the date
    const events = await this.routeHelperService.getStudentEventsForDate(
      userId,
      uniId,
      query.date,
      db,
    );

    //map tevents to route context
    const eventContexts = events
      .map((event) => this.routeHelperService.toEventContext(event, query.date))
      .sort(this.routeHelperService.compareEventContexts);

    //Build routes
    const routes: StudentRouteTransitionDto[] = [];

    for (let i = 0; i < eventContexts.length - 1; i += 1) {
      routes.push(
        await this.buildTransition({
          uniId,
          originEvent: eventContexts[i],
          destinationEvent: eventContexts[i + 1],
          routeIndex: 0, //default to shortest
          tx: db,
        }),
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

    const originContext = this.routeHelperService.toEventContext(
      originEvent,
      query.date,
    );
    const destinationContext = this.routeHelperService.toEventContext(
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
    options: BuildTransitionOptions,
  ): Promise<StudentRouteTransitionDto> {
    //Extract fields
    const { uniId, originEvent, destinationEvent, routeIndex, tx } = options;

    const index = routeIndex ?? 0;

    //Missing either origin or destination buildingID
    if (!originEvent.buildingId || !destinationEvent.buildingId) {
      return {
        originEvent,
        destinationEvent,
        sameBuilding: false,
        route: null,
        reason: 'One or both events have no building assigned',
      };
    }

    //Same building
    if (originEvent.buildingId === destinationEvent.buildingId) {
      return {
        originEvent,
        destinationEvent,
        sameBuilding: true,
        route: null,
      };
    }

    //route diversion
    const route = await this.routeService.getRecommendedRouteVariant({
      uniId,
      originBuildingId: originEvent.buildingId,
      destinationBuildingId: destinationEvent.buildingId,
      startAtIndex: index,
      tx,
    });

    return {
      originEvent,
      destinationEvent,
      sameBuilding: false,
      route,
    };
  } //END_buildTransistion

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

    const [event] = this.routeHelperService.selectFirstVenuePerEvent(
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
} //END_StudentRoutingService
