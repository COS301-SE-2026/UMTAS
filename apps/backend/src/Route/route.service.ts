import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { SessionData } from 'src/auth/session.decorator';
import { LatLngDto } from 'src/Building/dto/building.dto';
import { DatabaseService } from 'src/db/database.service';
import {
  Building,
  Event,
  EventAttendance,
  EventVenue,
  Route,
  Venue,
} from 'src/entities';
import {
  ActiveRouteResponseDto,
  ActiveRouteStatus,
  RouteDto,
  RouteSingleResponseDto,
} from './dto/route.dto';
import { eq, and } from 'drizzle-orm';

type RouteEntity = typeof Route.$inferSelect;

interface ORSWalkingResult {
  routeCoordinates: LatLngDto[];
  distanceMetres: number;
}
//NOTE THIS WAS MADE BY GEMINI TO FIND A CRITICAL BIG
//ALL THE CODE WILL BE REPLACED WITH THE ORIGINAL CODE ONCE THE BUG IS FOUND
@Injectable()
export class RouteService {
  private readonly logger = new Logger(RouteService.name);
  constructor(private readonly databaseService: DatabaseService) {}
  private orsApiKey = process.env.ORS_API_KEY;

  private requireUniId(session: SessionData | undefined): string {
    if (!session?.user) {
      throw new ForbiddenException('No active session');
    }
    if (!session?.uniId) {
      throw new ForbiddenException('No university selected');
    }
    return session?.uniId;
  }

  private routeDtoAdapter(row: RouteEntity): RouteDto {
    return {
      routeId: row.RouteID,
      originBuildingId: row.OriginBuildingID,
      pathCoordinates: row.PathCoordinates,
      destinationBuildingId: row.DestinationBuildingID,
      distanceMetres: row.DistanceMetres,
      displayColour: row.DisplayColour,
    };
  }

  public async getOrCreateRoute(
    session: SessionData,
    originBuildingId: string,
    destinationBuildingId: string,
  ): Promise<RouteSingleResponseDto> {
    this.logger.debug(
      `[getOrCreateRoute] Called for Origin: ${originBuildingId} -> Dest: ${destinationBuildingId}`,
    );

    if (originBuildingId === destinationBuildingId) {
      throw new BadRequestException(
        'Origin and destination buildings need to be different',
      );
    }

    const universityId = this.requireUniId(session);
    const database = this.databaseService.db;

    try {
      this.logger.debug(`[getOrCreateRoute] Checking DB for direct route...`);
      const [directRoute] = await database
        .select()
        .from(Route)
        .where(
          and(
            eq(Route.UniversityID, universityId),
            eq(Route.OriginBuildingID, originBuildingId),
            eq(Route.DestinationBuildingID, destinationBuildingId),
          ),
        )
        .limit(1);

      if (directRoute) {
        this.logger.debug(
          `[getOrCreateRoute] Found existing direct route in DB.`,
        );
        return { route: this.routeDtoAdapter(directRoute) };
      }

      this.logger.debug(`[getOrCreateRoute] Checking DB for reverse route...`);
      const [reverseRoute] = await database
        .select()
        .from(Route)
        .where(
          and(
            eq(Route.UniversityID, universityId),
            eq(Route.OriginBuildingID, destinationBuildingId),
            eq(Route.DestinationBuildingID, originBuildingId),
          ),
        )
        .limit(1);

      if (reverseRoute) {
        this.logger.debug(
          `[getOrCreateRoute] Found reverse route. Adapting and returning.`,
        );
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

      this.logger.debug(
        `[getOrCreateRoute] Fetching building coordinates for ORS...`,
      );
      const [originBuilding] = await database
        .select()
        .from(Building)
        .where(eq(Building.BuildingID, originBuildingId))
        .limit(1);

      const [destinationBuilding] = await database
        .select()
        .from(Building)
        .where(eq(Building.BuildingID, destinationBuildingId))
        .limit(1);

      if (
        originBuilding?.Latitude == null ||
        originBuilding?.Longitude == null ||
        destinationBuilding?.Latitude == null ||
        destinationBuilding?.Longitude == null
      ) {
        this.logger.error(
          `[getOrCreateRoute] Missing coordinates. Origin Lat: ${originBuilding?.Latitude}, Dest Lat: ${destinationBuilding?.Latitude}`,
        );
        throw new NotFoundException(
          'One/both buildings do not have coordinates pinned',
        );
      }

      this.logger.debug(`[getOrCreateRoute] Initiating ORS fetch...`);
      const orsResult = await this.fetchFromORS(
        { lat: originBuilding.Latitude, lng: originBuilding.Longitude },
        {
          lat: destinationBuilding.Latitude,
          lng: destinationBuilding.Longitude,
        },
      );

      this.logger.debug(`[getOrCreateRoute] Saving new ORS route to DB...`);
      const [newRoute] = await database
        .insert(Route)
        .values({
          UniversityID: universityId,
          DestinationBuildingID: destinationBuildingId,
          OriginBuildingID: originBuildingId,
          PathCoordinates: orsResult.routeCoordinates,
          DistanceMetres: orsResult.distanceMetres,
        })
        .returning();

      return { route: this.routeDtoAdapter(newRoute) };
    } catch (error) {
      this.logger.error(
        `[getOrCreateRoute] FATAL ERROR: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  public async getActiveRoute(
    session: SessionData,
    date: string,
    time: string,
  ): Promise<ActiveRouteResponseDto> {
    this.logger.debug(`\n--- [getActiveRoute] START ---`);
    this.logger.debug(
      `[getActiveRoute] Params - Date: ${date}, Time: ${time}, User: ${session.user.id}`,
    );

    const userId = session.user.id;
    const database = this.databaseService.db;

    try {
      this.logger.debug(`[getActiveRoute] Fetching attended events from DB...`);
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

      this.logger.debug(
        `[getActiveRoute] Found ${attendedEvents.length} events.`,
      );

      let sortedAttendedEvents;
      try {
        sortedAttendedEvents = attendedEvents
          .map((event) => {
            if (
              !event.eventCriteria?.startTime ||
              !event.eventCriteria?.endTime
            ) {
              this.logger.error(
                `[getActiveRoute] Event ${event.eventId} is missing start/endTime! Raw criteria: ${JSON.stringify(event.eventCriteria)}`,
              );
            }
            return {
              ...event,
              startTime: event.eventCriteria.startTime,
              endTime: event.eventCriteria.endTime,
            };
          })
          .sort((x, y) => x.startTime.localeCompare(y.startTime));
      } catch (sortError) {
        this.logger.error(
          `[getActiveRoute] Crash during event sorting: ${(sortError as Error).message}`,
        );
        throw new InternalServerErrorException('Failed to sort user events.');
      }

      this.logger.debug(
        `[getActiveRoute] Evaluating routing loop for ${sortedAttendedEvents.length} events...`,
      );
      for (let i = 0; i < sortedAttendedEvents.length - 1; i++) {
        const fromAttendedEvent = sortedAttendedEvents[i];
        const toAttendedEvent = sortedAttendedEvents[i + 1];

        if (
          time >= fromAttendedEvent.endTime &&
          (time <= toAttendedEvent.startTime ||
            fromAttendedEvent.endTime > toAttendedEvent.startTime)
        ) {
          this.logger.debug(
            `[getActiveRoute] Condition met for route between ${fromAttendedEvent.eventName} and ${toAttendedEvent.eventName}`,
          );

          const fromBuildingId = await this.getMatchingBuildingId(
            fromAttendedEvent.eventId,
          );
          const toBuildingId = await this.getMatchingBuildingId(
            toAttendedEvent.eventId,
          );

          if (!fromBuildingId || !toBuildingId) {
            this.logger.warn(
              `[getActiveRoute] Missing building mapping. From: ${fromBuildingId}, To: ${toBuildingId}`,
            );
            return { status: ActiveRouteStatus.NONE };
          }

          if (fromBuildingId === toBuildingId) {
            this.logger.debug(
              `[getActiveRoute] Moving within same building. Returning AT_VENUE.`,
            );
            return {
              status: ActiveRouteStatus.AT_VENUE,
              currentBuildingId: fromBuildingId,
            };
          }

          this.logger.debug(`[getActiveRoute] Calling getOrCreateRoute...`);
          const { route } = await this.getOrCreateRoute(
            session,
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

      this.logger.debug(
        `[getActiveRoute] Not in transit. Checking if currently at a venue...`,
      );
      const currentEvent = sortedAttendedEvents.find(
        (event) => time >= event.startTime && time <= event.endTime,
      );

      if (currentEvent) {
        this.logger.debug(
          `[getActiveRoute] At venue for event: ${currentEvent.eventName}`,
        );
        const buildingId = await this.getMatchingBuildingId(
          currentEvent.eventId,
        );

        if (!buildingId) {
          this.logger.warn(
            `[getActiveRoute] Current event has no building pinned.`,
          );
          return { status: ActiveRouteStatus.NONE };
        }

        return {
          status: ActiveRouteStatus.AT_VENUE,
          currentBuildingId: buildingId,
          fromEventName: currentEvent.eventName,
        };
      }

      this.logger.debug(
        `[getActiveRoute] No active routing state found. Returning NONE.`,
      );
      return { status: ActiveRouteStatus.NONE };
    } catch (error) {
      this.logger.error(
        `[getActiveRoute] FATAL ERROR: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  private async getMatchingBuildingId(eventId: string): Promise<string | null> {
    const database = this.databaseService.db;
    const [row] = await database
      .select({ buildingId: Venue.BuildingID })
      .from(EventVenue)
      .innerJoin(Venue, eq(Venue.VenueID, EventVenue.VenueID))
      .where(eq(EventVenue.EventID, eventId))
      .limit(1);

    return row?.buildingId ?? null;
  }

  private async fetchFromORS(
    start: LatLngDto,
    end: LatLngDto,
  ): Promise<ORSWalkingResult> {
    this.logger.debug(
      `[fetchFromORS] Preparing fetch. Start: ${start.lat},${start.lng} | End: ${end.lat},${end.lng}`,
    );

    if (!this.orsApiKey) {
      this.logger.error(
        `[fetchFromORS] CRITICAL: ORS_API_KEY is null or undefined in this environment!`,
      );
    } else {
      this.logger.debug(
        `[fetchFromORS] ORS_API_KEY is present (Length: ${this.orsApiKey.length})`,
      );
    }

    const url = new URL(
      'https://api.openrouteservice.org/v2/directions/foot-walking',
    );
    url.searchParams.set('api_key', this.orsApiKey ?? '');
    url.searchParams.set('start', `${start.lng},${start.lat}`);
    url.searchParams.set('end', `${end.lng},${end.lat}`);

    try {
      this.logger.debug(`[fetchFromORS] Executing fetch request to ORS...`);
      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `[fetchFromORS] ORS HTTP Error ${response.status} ${response.statusText}. Body: ${errorText}`,
        );
        throw new InternalServerErrorException(
          `ORS routing failed: HTTP ${response.status}`,
        );
      }

      const data = await response.json();
      const feature = data.features?.[0];

      if (!feature) {
        this.logger.error(
          `[fetchFromORS] ORS returned 200 OK but features array is missing or empty. Data: ${JSON.stringify(data)}`,
        );
        throw new NotFoundException(
          'No walking path was found between the start and end buildings',
        );
      }

      const coordinates: [number, number][] = feature.geometry.coordinates;
      const routeCoordinates: LatLngDto[] = coordinates.map(([lng, lat]) => ({
        lat,
        lng,
      }));

      const summary = feature.properties.summary;
      this.logger.debug(
        `[fetchFromORS] Fetch successful. Distance: ${summary.distance}m`,
      );

      return {
        routeCoordinates,
        distanceMetres: Math.round(summary.distance),
      };
    } catch (error) {
      this.logger.error(
        `[fetchFromORS] Exception during fetch: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to communicate with OpenRouteService',
      );
    }
  }
}
