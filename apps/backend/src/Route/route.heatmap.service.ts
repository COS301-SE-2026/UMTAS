import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/db/database.service';
import { RecurringEventService } from 'src/Events/recurring-event.service';
import { AppDatabase } from 'src/auth/auth';
import {
  Building,
  Event,
  EventAttendance,
  EventVenue,
  ModuleEnrollment,
  Route,
  UniversityEvent,
  Venue,
} from 'src/entities';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

//Dtos
import {
  RouteHeatmapDto,
  RouteHeatmapHourlyBucketDto,
  RouteHeatmapTransitionDto,
  RoutingHeatmapQueryDto,
  RoutingHeatmapResponseDto,
  RoutingHeatmapView,
} from './dto/route.heatmap.dto';
import { EventCriteria } from 'src/Events/dto/event.types';

type RouteEntity = typeof Route.$inferSelect;

//RouteRow
export type RouteRow = {
  routeId: string;
  routeIndex: number;
  originBuildingId: string;
  originBuildingName: string;
  destinationBuildingId: string;
  destinationBuildingName: string;
  pathCoordinates: RouteEntity['PathCoordinates'];
  distanceMetres: number;
  displayColour: string;
};

//ALiases for buildings
const originBuilding = alias(Building, 'routing_heatmap_origin_building');
const destinationBuilding = alias(
  Building,
  'routing_heatmap_destination_building',
);

//Projected to attend event row
export type EventAttendingRow = {
  userId: string;
  eventId: string;
  eventName: string;
  eventCriteria: EventCriteria;
  isRecurring: boolean;
  buildingId: string;
  moduleId: string | null;
};

//Transistion for event
export type EventTransition = {
  userIds: Set<string>;
  originEventId: string;
  destinationEventId: string;
  originEventName: string;
  destinationEventName: string;
  originBuildingId: string;
  destinationBuildingId: string;
  originEndTime: string;
  destinationStartTime: string;
  originModuleId: string | null;
  destinationModuleId: string | null;
};

//Transition demand
export type Demand = {
  projected: number;
  worstCase: number;
  transition: RouteHeatmapTransitionDto;
  hours: number[];
};

@Injectable()
export class RouteHeatmapService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly recEventService: RecurringEventService,
  ) {}

  async getRoutingHeatmap(
    uniId: string,
    query: RoutingHeatmapQueryDto,
    tx?: AppDatabase,
  ): Promise<RoutingHeatmapResponseDto> {
    const db = tx ?? this.dbService.db;

    //Get all routes for university
    const routes = await this.getUniversityRoutes(uniId, db);

    //No routes -> return early empty
    if (routes.length === 0) {
      return {
        universityId: uniId,
        date: query.date,
        view: query.view,
        routes: [],
      };
    }

    //Get events for which user said they'll attend - projected
    const events = await this.getProjectedAttendedEventsForDate(
      uniId,
      query.date,
      db,
    );

    //Transistions
    const transitions = this.buildTransitions(events);

    //Demand for building pairs
    const demandByBuildingPair = await this.transitionDemand(
      transitions,
      query.view,
      db,
    );

    return {
      universityId: uniId,
      date: query.date,
      view: query.view,
      routes: routes.map((route) =>
        this.buildRouteHeatmap(route, demandByBuildingPair),
      ),
    };
  } //END_getRoutingHeatmap

  //🎅's little helpers

  /**
   * Fetch all routes for a university with their origin, destination building names
   *
   * @param uniId - University the routes belong to
   * @param db - transaction
   * @returns Route rows enriched with building names
   */
  private async getUniversityRoutes(
    uniId: string,
    db: AppDatabase,
  ): Promise<RouteRow[]> {
    const rows = await db
      .select({
        routeId: Route.RouteID,
        routeIndex: Route.RouteIndex,
        originBuildingId: Route.OriginBuildingID,
        originBuildingName: originBuilding.BuildingName,
        destinationBuildingId: Route.DestinationBuildingID,
        destinationBuildingName: destinationBuilding.BuildingName,
        pathCoordinates: Route.PathCoordinates,
        distanceMetres: Route.DistanceMetres,
        displayColour: Route.DisplayColour,
      })
      .from(Route)
      .innerJoin(
        originBuilding,
        eq(originBuilding.BuildingID, Route.OriginBuildingID),
      )
      .innerJoin(
        destinationBuilding,
        eq(destinationBuilding.BuildingID, Route.DestinationBuildingID),
      )
      .where(
        and(
          eq(Route.UniversityID, uniId),
          eq(originBuilding.UniversityID, uniId),
          eq(destinationBuilding.UniversityID, uniId),
        ),
      )
      .orderBy(
        asc(Route.OriginBuildingID),
        asc(Route.DestinationBuildingID),
        asc(Route.RouteIndex),
      );

    return rows;
  } //END_getUniversityRoutes

  /**
   * Fetches events attended on a date at a university, filtered by date
   *
   * @param uniId - University
   * @param date - Date for events
   * @param database - transaction
   * @returns Attending event rows with a building Id attached
   */
  private async getProjectedAttendedEventsForDate(
    uniId: string,
    date: string,
    database: AppDatabase,
  ): Promise<EventAttendingRow[]> {
    const rows = await database
      .select({
        userId: EventAttendance.UserID,
        eventId: Event.eventID,
        eventName: Event.eventName,
        eventCriteria: Event.eventCriteria,
        isRecurring: Event.isRecurring,
        buildingId: Venue.BuildingID,
        moduleId: UniversityEvent.moduleID,
      })
      .from(EventAttendance)
      .innerJoin(Event, eq(Event.eventID, EventAttendance.eventID))
      .leftJoin(UniversityEvent, eq(UniversityEvent.eventID, Event.eventID))
      .innerJoin(EventVenue, eq(EventVenue.EventID, Event.eventID))
      .innerJoin(Venue, eq(Venue.VenueID, EventVenue.VenueID))
      .where(
        and(
          eq(EventAttendance.eventDate, date),
          eq(EventAttendance.state, 'ATTENDING'),
          eq(Venue.UniversityID, uniId),
        ),
      )
      .orderBy(
        asc(EventAttendance.UserID),
        asc(Event.eventCriteria),
        asc(Event.eventID),
        asc(EventVenue.VenueID),
      );

    return rows
      .filter((row): row is typeof row & { buildingId: string } => {
        if (!row.buildingId) return false;

        return this.recEventService.occursOnDate(
          {
            eventId: row.eventId,
            eventCriteria: row.eventCriteria,
            isRecurring: row.isRecurring,
          },
          date,
        );
      })
      .map((row) => ({
        userId: row.userId,
        eventId: row.eventId,
        eventName: row.eventName,
        eventCriteria: row.eventCriteria,
        isRecurring: row.isRecurring,
        buildingId: row.buildingId,
        moduleId: row.moduleId,
      }));
  } //END_getProjectedAttendedEventsForDate

  /**
   * Builds user event transitions from attending event rows
   *
   * @param rows - Attending event rows
   * @returns One transition per unique event pair with set of users
   */
  private buildTransitions(rows: EventAttendingRow[]): EventTransition[] {
    const eventsByUser = new Map<string, EventAttendingRow[]>();

    for (const r of rows) {
      const existing = eventsByUser.get(r.userId) ?? [];

      //Only take first venue for each event - nobody will know ;)
      if (existing.some((event) => event.eventId === r.eventId)) {
        continue;
      }

      existing.push(r);
      eventsByUser.set(r.userId, existing);
    } //END_r

    const transitionsByPair = new Map<string, EventTransition>();

    for (const event of eventsByUser.values()) {
      //Sort according to startTime
      const sortedEvents = [...event].sort((left, right) => {
        const startTimeComparison = left.eventCriteria.startTime.localeCompare(
          right.eventCriteria.startTime,
        );

        if (startTimeComparison !== 0) {
          return startTimeComparison;
        }

        //Then ids
        return left.eventId.localeCompare(right.eventId);
      }); //END_sort

      //
      for (let i = 0; i < sortedEvents.length - 1; i += 1) {
        const origin = sortedEvents[i];
        const destination = sortedEvents[i + 1];

        //Skip if same building / origin overlaps with desitnation time
        if (
          origin.buildingId === destination.buildingId ||
          origin.eventCriteria.endTime > destination.eventCriteria.startTime
        ) {
          continue;
        }

        const pair = [
          origin.eventId,
          destination.eventId,
          origin.buildingId,
          destination.buildingId,
        ].join(':');

        //Check if already existing
        const existing = transitionsByPair.get(pair);

        if (existing) {
          existing.userIds.add(origin.userId);
          continue;
        }

        transitionsByPair.set(pair, {
          userIds: new Set([origin.userId]),
          originEventId: origin.eventId,
          destinationEventId: destination.eventId,
          originEventName: origin.eventName,
          destinationEventName: destination.eventName,
          originBuildingId: origin.buildingId,
          destinationBuildingId: destination.buildingId,
          originEndTime: origin.eventCriteria.endTime,
          destinationStartTime: destination.eventCriteria.startTime,
          originModuleId: origin.moduleId,
          destinationModuleId: destination.moduleId,
        });
      } //END_i
    } //END_event

    return [...transitionsByPair.values()];
  } //END_buildTransitions

  /**
   * Builds demand entries per building pair from a transitions
   *
   * @param transitions - Transitions
   * @param view - which stats
   * @param tx - transaction
   * @returns Demand entries keyed as origin:destination building pair
   */
  private async transitionDemand(
    transitions: EventTransition[],
    view: RoutingHeatmapView,
    tx: AppDatabase,
  ): Promise<Map<string, Demand[]>> {
    const demandByPair = new Map<string, Demand[]>();

    for (const t of transitions) {
      //How many projected attendance
      const projected =
        view === RoutingHeatmapView.WORST_CASE ? 0 : t.userIds.size;

      //How many enrolled students
      const worstCase =
        view === RoutingHeatmapView.PROJECTED
          ? 0
          : await this.getWorstCaseCount(t, tx);

      //If both 0 no need to add pair
      if (projected === 0 && worstCase === 0) {
        continue;
      }

      //Construct route specific heatmap dto
      const transitionDto: RouteHeatmapTransitionDto = {
        originEventId: t.originEventId,
        destinationEventId: t.destinationEventId,
        originEventName: t.originEventName,
        destinationEventName: t.destinationEventName,
        originEndTime: t.originEndTime,
        destinationStartTime: t.destinationStartTime,
        projected,
        worstCase,
      };

      //key to uniquely identify transition
      const key = this.buildPairKey(
        t.originBuildingId,
        t.destinationBuildingId,
      );

      //Demand on route
      const demand = {
        projected,
        worstCase,
        transition: transitionDto,
        hours: this.getTransitionHours(t.originEndTime, t.destinationStartTime),
      };

      //If already have key + add demand
      const existing = demandByPair.get(key) ?? [];
      existing.push(demand);

      demandByPair.set(key, existing);
    } //END_t

    return demandByPair;
  } //END_transitionDemand

  /**
   * Counts students enrolled in both the origin and destination module of a transition for worstCase stat
   *
   * @param transition - Transition to count for
   * @param tx - transactoin
   * @returns Number of students enrolled in both modules
   */
  private async getWorstCaseCount(
    transition: EventTransition,
    tx: AppDatabase,
  ): Promise<number> {
    const originModuleId = transition.originModuleId;
    const destinationModuleId = transition.destinationModuleId;

    //Check that module ids presetn
    if (!originModuleId || !destinationModuleId) {
      return 0;
    }

    const rows = await tx
      .select({
        moduleId: ModuleEnrollment.ModuleID,
        userId: ModuleEnrollment.UserID,
      })
      .from(ModuleEnrollment)
      .where(
        inArray(ModuleEnrollment.ModuleID, [
          originModuleId,
          destinationModuleId,
        ]),
      );

    //Map module to all users enrolled
    const enrolledByModule = new Map<string, Set<string>>();

    for (const r of rows) {
      const users = enrolledByModule.get(r.moduleId) ?? new Set<string>();

      users.add(r.userId);
      enrolledByModule.set(r.moduleId, users);
    } //END_r

    //Students enrolled in origin
    const originStudents =
      enrolledByModule.get(originModuleId) ?? new Set<string>();

    //Students enrolled in destination
    const destinationStudents =
      enrolledByModule.get(destinationModuleId) ?? new Set<string>();

    let worstCaseCount = 0;

    //Only count when user is enrolled in both origin and destination
    for (const id of originStudents) {
      if (destinationStudents.has(id)) {
        worstCaseCount += 1;
      }
    } //END_id

    return worstCaseCount;
  } //END_getWorstCaseCount

  /**
   * Builds a pair key from origin and destination building IDs
   *
   * @param originBuildingId - Origin
   * @param destinationBuildingId - Destination
   * @returns origin : destination
   */
  private buildPairKey(
    originBuildingId: string,
    destinationBuildingId: string,
  ) {
    return `${originBuildingId}:${destinationBuildingId}`;
  } //END_buildPairKey

  /**
   * Returns the hour indices spanning a transition between two events
   *
   * @param originEndTime - Origin end time
   * @param destinationStartTime - Destination start time
   * @returns Hour indices contained in transition
   */
  private getTransitionHours(
    originEndTime: string,
    destinationStartTime: string,
  ): number[] {
    const origin = toMinutes(originEndTime);
    const destination = toMinutes(destinationStartTime);

    if (destination <= origin) {
      return [Math.floor(origin / 60)];
    }

    const firstHour = Math.floor(origin / 60);
    const lastHour = Math.floor((destination - 1) / 60);

    return Array.from(
      { length: lastHour - firstHour + 1 },
      (_, index) => firstHour + index,
    ).filter((hour) => hour >= 0 && hour <= 23);
  } //END_getTransitionHours

  /**
   * Builds a route heatmap DTO from a route and its matching demand entries
   * Sums demand across all transitions on the route and distributes it into
   * 24 hourly buckets
   *
   * @param route - Route row
   * @param demandByPair - Demand entries
   * @returns Route heatmap DTO
   */
  private buildRouteHeatmap(
    route: RouteRow,
    demandByPair: Map<string, Demand[]>,
  ): RouteHeatmapDto {
    const pairKey = this.buildPairKey(
      route.originBuildingId,
      route.destinationBuildingId,
    );

    const demands = demandByPair.get(pairKey) ?? [];
    const projected = demands.reduce(
      (total, demand) => total + demand.projected,
      0,
    );
    const worstCase = demands.reduce(
      (total, demand) => total + demand.worstCase,
      0,
    );

    const hourly = createHourlyBuckets();

    for (const demand of demands) {
      for (const hour of demand.hours) {
        hourly[hour].projected += demand.projected;
        hourly[hour].worstCase += demand.worstCase;
      }
    }

    return {
      routeId: route.routeId,
      routeIndex: route.routeIndex,
      origin: {
        buildingId: route.originBuildingId,
        buildingName: route.originBuildingName,
      },
      destination: {
        buildingId: route.destinationBuildingId,
        buildingName: route.destinationBuildingName,
      },
      distanceMetres: route.distanceMetres,
      pathCoordinates: route.pathCoordinates,
      displayColour: route.displayColour,
      projected,
      worstCase,
      actual: null,
      hourly,
      transitions: demands.map((demand) => demand.transition),
    };
  } //END_buildRouteHeatmap
} //END_RouteHeatmapService

/**
 * Converts time to int
 *
 * @param value - Time
 * @returns Minutes since midnight
 */
function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
} //END_toMinutes

function createHourlyBuckets(): RouteHeatmapHourlyBucketDto[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    projected: 0,
    worstCase: 0,
    actual: null,
  }));
} //createHourlyBuckets
