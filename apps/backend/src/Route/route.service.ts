import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/db/database.service';
import {
  Building,
  Event,
  EventAttendance,
  EventVenue,
  Route,
  RouteDiversion,
  Venue,
} from 'src/entities';
import {
  ActiveRouteResponseDto,
  ActiveRouteStatus,
  RouteDto,
  RouteSingleResponseDto,
} from './dto';
import { eq, and, inArray, asc } from 'drizzle-orm';
import { OrsService } from './ors.service';
import { AppDatabase } from 'src/auth/auth';

type RouteEntity = typeof Route.$inferSelect;

export interface recommendedRouteVariantOptions {
  uniId: string;
  originBuildingId: string;
  destinationBuildingId: string;
  startAtIndex?: number;
  tx: AppDatabase;
}

@Injectable()
export class RouteService {
  private readonly OOPSIE = new Logger(this.constructor.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly orsService: OrsService,
  ) {}

  //Crud
  async getById(
    routeId: string,
    tx?: AppDatabase,
  ): Promise<RouteSingleResponseDto> {
    const db = tx ?? this.databaseService.db;

    //fetch route
    const [route] = await db
      .select()
      .from(Route)
      .where(eq(Route.RouteID, routeId))
      .limit(1);

    if (!route) {
      this.OOPSIE.warn(`Route[${routeId}] not found`);
      throw new NotFoundException(`Route not found`);
    }

    const response: RouteDto = this.routeDtoAdapter(route);

    return { route: response };
  } //END_getById

  async getRouteVariant(
    uniId: string,
    originBuildingId: string,
    destinationBuildingId: string,
    routeIndex: number,
    tx?: AppDatabase,
  ): Promise<RouteDto> {
    if (!Number.isInteger(routeIndex) || routeIndex < 0) {
      throw new BadRequestException(
        'routeIndex must be a non-negative integer',
      );
    }

    if (originBuildingId === destinationBuildingId) {
      throw new BadRequestException(
        'Origin and destination buildings need to be different',
      );
    }

    const db = tx ?? this.databaseService.db;

    const [cachedRoute] = await db
      .select()
      .from(Route)
      .where(
        and(
          eq(Route.UniversityID, uniId),
          eq(Route.OriginBuildingID, originBuildingId),
          eq(Route.DestinationBuildingID, destinationBuildingId),
          eq(Route.RouteIndex, routeIndex),
        ),
      )
      .limit(1);

    if (cachedRoute) {
      return this.routeDtoAdapter(cachedRoute);
    }

    const [reverseRoute] = await db
      .select()
      .from(Route)
      .where(
        and(
          eq(Route.UniversityID, uniId),
          eq(Route.OriginBuildingID, destinationBuildingId),
          eq(Route.DestinationBuildingID, originBuildingId),
          eq(Route.RouteIndex, routeIndex),
        ),
      )
      .limit(1);

    if (reverseRoute) {
      const dto = this.routeDtoAdapter(reverseRoute);

      return {
        ...dto,
        originBuildingId,
        destinationBuildingId,
        pathCoordinates: [...dto.pathCoordinates].reverse(),
      };
    }

    if (routeIndex === 0) {
      const { route } = await this.getOrCreateRoute(
        uniId,
        originBuildingId,
        destinationBuildingId,
        db,
      );

      return route;
    }

    const buildings = await this.getBuildingsForRoute(
      uniId,
      originBuildingId,
      destinationBuildingId,
      db,
    );

    const orsRoutes = await this.orsService.getWalkingRouteVariants(
      {
        lat: buildings.origin.Latitude,
        lng: buildings.origin.Longitude,
      },
      {
        lat: buildings.destination.Latitude,
        lng: buildings.destination.Longitude,
      },
    );

    await this.persistRouteVariants(
      uniId,
      originBuildingId,
      destinationBuildingId,
      orsRoutes,
      db,
    );

    const [requestedRoute] = await db
      .select()
      .from(Route)
      .where(
        and(
          eq(Route.UniversityID, uniId),
          eq(Route.OriginBuildingID, originBuildingId),
          eq(Route.DestinationBuildingID, destinationBuildingId),
          eq(Route.RouteIndex, routeIndex),
        ),
      )
      .limit(1);

    if (!requestedRoute) {
      throw new NotFoundException(
        `Route alternative with index ${routeIndex} is not available`,
      );
    }

    return this.routeDtoAdapter(requestedRoute);
  } //END_getRouteVariant

  async getOrCreateRoute(
    uniId: string,
    originBuildingId: string,
    destinationBuildingId: string,
    tx?: AppDatabase,
  ): Promise<RouteSingleResponseDto> {
    if (originBuildingId === destinationBuildingId) {
      throw new BadRequestException(
        'Origin and destination buildings need to be different',
      );
    }

    const db = tx ?? this.databaseService.db;

    const [directRoute] = await db
      .select()
      .from(Route)
      .where(
        and(
          eq(Route.UniversityID, uniId),
          eq(Route.OriginBuildingID, originBuildingId),
          eq(Route.DestinationBuildingID, destinationBuildingId),
          eq(Route.RouteIndex, 0),
        ),
      )
      .limit(1);

    if (directRoute) {
      return { route: this.routeDtoAdapter(directRoute) };
    }

    const [reverseRoute] = await db
      .select()
      .from(Route)
      .where(
        and(
          eq(Route.UniversityID, uniId),
          eq(Route.OriginBuildingID, destinationBuildingId),
          eq(Route.DestinationBuildingID, originBuildingId),
          eq(Route.RouteIndex, 0),
        ),
      )
      .limit(1);

    if (reverseRoute) {
      const dto = this.routeDtoAdapter(reverseRoute);

      return {
        route: {
          ...dto,
          originBuildingId,
          destinationBuildingId,
          pathCoordinates: [...dto.pathCoordinates].reverse(),
        },
      };
    }

    const buildings = await db
      .select({
        buildingId: Building.BuildingID,
        latitude: Building.Latitude,
        longitude: Building.Longitude,
      })
      .from(Building)
      .where(
        and(
          eq(Building.UniversityID, uniId),
          inArray(Building.BuildingID, [
            originBuildingId,
            destinationBuildingId,
          ]),
        ),
      );

    const buildingsById = new Map(
      buildings.map((building) => [building.buildingId, building]),
    );

    const originBuilding = buildingsById.get(originBuildingId);
    const destinationBuilding = buildingsById.get(destinationBuildingId);

    if (
      originBuilding?.latitude == null ||
      originBuilding.longitude == null ||
      destinationBuilding?.latitude == null ||
      destinationBuilding.longitude == null
    ) {
      throw new NotFoundException(
        'One or both buildings do not exist in the selected university or do not have coordinates pinned',
      );
    }

    const orsResult = await this.orsService.getWalkingRoute(
      {
        lat: originBuilding.latitude,
        lng: originBuilding.longitude,
      },
      {
        lat: destinationBuilding.latitude,
        lng: destinationBuilding.longitude,
      },
    );

    const [newRoute] = await db
      .insert(Route)
      .values({
        UniversityID: uniId,
        OriginBuildingID: originBuildingId,
        DestinationBuildingID: destinationBuildingId,
        RouteIndex: 0,
        PathCoordinates: orsResult.routeCoordinates,
        DistanceMetres: orsResult.distanceMetres,
      })
      .returning();

    if (!newRoute) {
      throw new NotFoundException('Route could not be created');
    }

    return {
      route: this.routeDtoAdapter(newRoute),
    };
  } //END_getOrCreateRoute

  async getActiveRoute(
    userId: string,
    uniId: string,
    date: string,
    time: string,
  ): Promise<ActiveRouteResponseDto> {
    const database = this.databaseService.db;

    const attendedEvents = await database
      .select({
        eventId: Event.eventID,
        eventName: Event.eventName,
        eventCriteria: Event.eventCriteria,
      })
      .from(EventAttendance)
      .innerJoin(Event, eq(Event.eventID, EventAttendance.eventID))
      .where(
        and(
          eq(EventAttendance.UserID, userId),
          eq(EventAttendance.eventDate, date),
          eq(EventAttendance.state, 'ATTENDING'),
        ),
      );

    const sortedAttendedEvents = attendedEvents
      .map((event) => ({
        ...event,
        startTime: event.eventCriteria.startTime,
        endTime: event.eventCriteria.endTime,
      }))
      .sort((x, y) => x.startTime.localeCompare(y.startTime));

    for (let i = 0; i < sortedAttendedEvents.length - 1; i++) {
      const fromAttendedEvent = sortedAttendedEvents[i];
      const toAttendedEvent = sortedAttendedEvents[i + 1];

      if (
        time >= fromAttendedEvent.endTime &&
        (time <= toAttendedEvent.startTime ||
          fromAttendedEvent.endTime > toAttendedEvent.startTime)
      ) {
        const fromBuildingId = await this.getMatchingBuildingId(
          fromAttendedEvent.eventId,
        );
        const toBuildingId = await this.getMatchingBuildingId(
          toAttendedEvent.eventId,
        );

        if (!fromBuildingId || !toBuildingId) {
          return { status: ActiveRouteStatus.NONE };
        }

        if (fromBuildingId === toBuildingId) {
          return {
            status: ActiveRouteStatus.AT_VENUE,
            currentBuildingId: fromBuildingId,
          };
        }

        const { route } = await this.getOrCreateRoute(
          uniId,
          fromBuildingId,
          toBuildingId,
        );

        return {
          status: ActiveRouteStatus.MOVING,
          route: route,
          fromEventName: fromAttendedEvent.eventName,
          toEventName: toAttendedEvent.eventName,
        };
      }
    }

    const currentEvent = sortedAttendedEvents.find(
      (event) => time >= event.startTime && time <= event.endTime,
    );

    if (currentEvent) {
      const buildingId = await this.getMatchingBuildingId(currentEvent.eventId);
      if (!buildingId) {
        return { status: ActiveRouteStatus.NONE };
      }

      return {
        status: ActiveRouteStatus.AT_VENUE,
        currentBuildingId: buildingId,
        fromEventName: currentEvent.eventName,
      };
    }

    return { status: ActiveRouteStatus.NONE };
  } //END_getActiveRoute

  async getRecommendedRouteVariant(
    options: recommendedRouteVariantOptions,
  ): Promise<RouteDto> {
    //extract fields
    const { uniId, originBuildingId, destinationBuildingId, startAtIndex, tx } =
      options;

    //Get start route
    const startRoute = await this.getRouteVariant(
      uniId,
      originBuildingId,
      destinationBuildingId,
      startAtIndex ?? 0,
      tx,
    );

    const selectedRouteId = await this.getDiversionTarget(
      startRoute.routeId,
      tx,
    );

    //Base Case
    if (!selectedRouteId) {
      return startRoute;
    }

    const selectedRoute = (await this.getById(selectedRouteId, tx)).route;

    //Recursive call until base case - which is we dont divert
    return this.getRecommendedRouteVariant({
      ...options,
      startAtIndex: selectedRoute.routeIndex,
    });
  } //END_getRecommendedRouteVariant

  //🎅's little helpers

  /**
   * Maps a Route row to a RouteDto.
   *
   * @param row - Raw Route row.
   * @returns The mapped RouteDto.
   */
  private routeDtoAdapter(row: RouteEntity): RouteDto {
    return {
      routeId: row.RouteID,
      originBuildingId: row.OriginBuildingID,
      destinationBuildingId: row.DestinationBuildingID,
      routeIndex: row.RouteIndex,
      pathCoordinates: row.PathCoordinates,
      distanceMetres: row.DistanceMetres,
      displayColour: row.DisplayColour,
    };
  } //END_routeDtoAdapter

  /**
   * Returns the building ID for an event's first venue
   *
   * When an event has multiple venues, only the first one is used
   *
   * @param eventId - Event to look up
   * @returns The building ID, or null if none found
   */
  private async getMatchingBuildingId(eventId: string): Promise<string | null> {
    const database = this.databaseService.db;

    //note for future dev: events can have multiple venues (thank you for the added complexity michael)
    //for now we are just taking the first event from the array
    const [row] = await database
      .select({ buildingId: Venue.BuildingID })
      .from(EventVenue)
      .innerJoin(Venue, eq(Venue.VenueID, EventVenue.VenueID))
      .where(eq(EventVenue.EventID, eventId))
      .orderBy(asc(EventVenue.VenueID))
      .limit(1);

    return row?.buildingId ?? null;
  } //END_getMatchingBuildingId

  /**
   * Fetches two buildings and returns their pinned coordinates.
   *
   * @param uniId - University both buildings must belong to.
   * @param originBuildingId - Starting building.
   * @param destinationBuildingId - Ending building.
   * @param tx - Active database transaction.
   * @returns Origin and destination coordinates.
   * @throws NotFoundException when either building is missing or unpinned.
   */
  private async getBuildingsForRoute(
    uniId: string,
    originBuildingId: string,
    destinationBuildingId: string,
    tx: AppDatabase,
  ): Promise<{
    origin: {
      Latitude: number;
      Longitude: number;
    };
    destination: {
      Latitude: number;
      Longitude: number;
    };
  }> {
    const buildings = await tx
      .select({
        buildingId: Building.BuildingID,
        latitude: Building.Latitude,
        longitude: Building.Longitude,
      })
      .from(Building)
      .where(
        and(
          eq(Building.UniversityID, uniId),
          inArray(Building.BuildingID, [
            originBuildingId,
            destinationBuildingId,
          ]),
        ),
      );

    const buildingsById = new Map(
      buildings.map((building) => [building.buildingId, building]),
    );

    const origin = buildingsById.get(originBuildingId);
    const destination = buildingsById.get(destinationBuildingId);

    if (
      origin?.latitude == null ||
      origin.longitude == null ||
      destination?.latitude == null ||
      destination.longitude == null
    ) {
      throw new NotFoundException(
        'One or both buildings do not exist in the selected university or do not have coordinates pinned',
      );
    }

    return {
      origin: {
        Latitude: origin.latitude,
        Longitude: origin.longitude,
      },
      destination: {
        Latitude: destination.latitude,
        Longitude: destination.longitude,
      },
    };
  } //END_getBuildingsForRoute

  /**
   * Inserts route variants, skipping already exist ones
   *
   * @param uniId - University the routes belong to
   * @param originBuildingId - Starting building
   * @param destinationBuildingId - Ending building
   * @param routes - Route variants to persist
   * @param tx - Active database transaction
   * @returns Inserted rows. Empty when `routes` is empty
   */
  private async persistRouteVariants(
    uniId: string,
    originBuildingId: string,
    destinationBuildingId: string,
    routes: Array<{
      routeIndex: number;
      routeCoordinates: RouteEntity['PathCoordinates'];
      distanceMetres: number;
    }>,
    tx: AppDatabase,
  ): Promise<RouteEntity[]> {
    if (routes.length === 0) {
      return [];
    }

    return tx
      .insert(Route)
      .values(
        routes.map((route) => ({
          UniversityID: uniId,
          OriginBuildingID: originBuildingId,
          DestinationBuildingID: destinationBuildingId,
          RouteIndex: route.routeIndex,
          PathCoordinates: route.routeCoordinates,
          DistanceMetres: route.distanceMetres,
        })),
      )
      .onConflictDoNothing({
        target: [
          Route.UniversityID,
          Route.OriginBuildingID,
          Route.DestinationBuildingID,
          Route.RouteIndex,
        ],
      })
      .returning();
  } //END_persistRouteVariants

  /**
   * Resolves a diversion target for a route, if one should be taken.
   *
   * @param fromRouteId - Route to look up a diversion for.
   * @param tx - Active database connection.
   * @returns The target route ID, or null when no diversion applies.
   */
  private async getDiversionTarget(
    fromRouteId: string,
    tx: AppDatabase,
  ): Promise<string | null> {
    const [diversion] = await tx
      .select({
        toRouteId: RouteDiversion.DivertToRoute,
        diversion: RouteDiversion.Diversion,
      })
      .from(RouteDiversion)
      .where(eq(RouteDiversion.RouteID, fromRouteId))
      .limit(1);

    if (!diversion || diversion.diversion <= 0) {
      return null;
    }

    if (this.shouldDivert(diversion.diversion)) {
      return diversion.toRouteId;
    }

    return null;
  } //END_getDiversionTarget

  /**
   * Decides whether to divert based on a probability.
   *
   * @param probability - Value between 0 and 1.
   * @returns True when the diversion should be taken.
   */
  private shouldDivert(probability: number): boolean {
    return probability >= 1 || Math.random() < probability;
  } //END_shouldDivert
} //END_RouteService
