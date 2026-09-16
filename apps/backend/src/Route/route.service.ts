import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { OrsService } from './ors.service';

type RouteEntity = typeof Route.$inferSelect;

@Injectable()
export class RouteService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly orsService: OrsService,
  ) {}

  async getRouteVariant(
    uniId: string,
    originBuildingId: string,
    destinationBuildingId: string,
    routeIndex: number,
  ): Promise<RouteDto> {
    if (!Number.isInteger(routeIndex) || routeIndex < 0) {
      throw new BadRequestException(
        'routeIndex must be a non-negative integer',
      );
    }

    if (routeIndex === 0) {
      const { route } = await this.getOrCreateRoute(
        uniId,
        originBuildingId,
        destinationBuildingId,
      );

      return route;
    }

    throw new NotFoundException(
      `Route alternative with index ${routeIndex} is not available`,
    );
  } //END_getRouteVariant

  async getOrCreateRoute(
    uniId: string,
    originBuildingId: string,
    destinationBuildingId: string,
  ): Promise<RouteSingleResponseDto> {
    const database = this.databaseService.db;

    if (originBuildingId === destinationBuildingId) {
      throw new BadRequestException(
        'Origin and destination buildings need to be different',
      );
    }

    const [directRoute] = await database
      .select()
      .from(Route)
      .where(
        and(
          eq(Route.UniversityID, uniId),
          eq(Route.OriginBuildingID, originBuildingId),
          eq(Route.DestinationBuildingID, destinationBuildingId),
        ),
      )
      .limit(1);

    if (directRoute) {
      return { route: this.routeDtoAdapter(directRoute) };
    }

    const [reverseRoute] = await database
      .select()
      .from(Route)
      .where(
        and(
          eq(Route.UniversityID, uniId),
          eq(Route.OriginBuildingID, destinationBuildingId),
          eq(Route.DestinationBuildingID, originBuildingId),
        ),
      )
      .limit(1);

    //if we have path A->B, we don't want to make a call for B->A, we just reverse it. big brain
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
      throw new NotFoundException(
        'One/both buildings do not have coordinates pinned',
      );
    }

    const orsResult = await this.orsService.getWalkingRoute(
      { lat: originBuilding.Latitude, lng: originBuilding.Longitude },
      { lat: destinationBuilding.Latitude, lng: destinationBuilding.Longitude },
    );

    const [newRoute] = await database
      .insert(Route)
      .values({
        UniversityID: uniId,
        DestinationBuildingID: destinationBuildingId,
        OriginBuildingID: originBuildingId,
        PathCoordinates: orsResult.routeCoordinates,
        DistanceMetres: orsResult.distanceMetres,
      })
      .returning();

    return { route: this.routeDtoAdapter(newRoute) };
  }

  async getActiveRoute(
    userId: string,
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
          userId,
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
  }

  //🎅's little helpers
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

  private async getMatchingBuildingId(eventId: string): Promise<string | null> {
    const database = this.databaseService.db;

    //note for future dev: events can have multiple venues (thank you for the added complexity michael)
    //for now we are just taking the first event from the array
    const [row] = await database
      .select({ buildingId: Venue.BuildingID })
      .from(EventVenue)
      .innerJoin(Venue, eq(Venue.VenueID, EventVenue.VenueID))
      .where(eq(EventVenue.EventID, eventId))
      .limit(1);

    return row?.buildingId ?? null;
  }
} //END_RouteService
