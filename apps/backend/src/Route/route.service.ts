import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SessionData } from 'src/auth/session.decorator';
import { LatLngDto } from 'src/Building/dto/building.dto';
import { DatabaseService } from 'src/db/database.service';
import { Building, Route } from 'src/entities';
import { RouteDto, RouteSingleResponseDto } from './dto/route.dto';
import { eq, and } from 'drizzle-orm';

type RouteEntity = typeof Route.$inferSelect;

interface ORSWalkingResult {
  routeCoordinates: LatLngDto[];
  distanceMetres: number;
}

@Injectable()
export class RouteService {
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
    const universityId = this.requireUniId(session);
    const database = this.databaseService.db;

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
      return { route: this.routeDtoAdapter(directRoute) };
    }

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

    const orsResult = await this.fetchFromORS(
      { lat: originBuilding.Latitude, lng: originBuilding.Longitude },
      { lat: destinationBuilding.Latitude, lng: destinationBuilding.Longitude },
    );

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
  }

  private async fetchFromORS(
    start: LatLngDto,
    end: LatLngDto,
  ): Promise<ORSWalkingResult> {
    const url = new URL(
      'https://api.openrouteservice.org/v2/directions/foot-walking',
    );

    url.searchParams.set('api_key', this.orsApiKey ?? '');
    url.searchParams.set('start', `${start.lng},${start.lat}`);
    url.searchParams.set('end', `${end.lng},${end.lat}`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new InternalServerErrorException(
        `ORS routing has failed: ${response.statusText}`,
      );
    }

    const data = await response.json();
    const feature = data.features?.[0];

    if (!feature) {
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

    return {
      routeCoordinates,
      distanceMetres: Math.round(summary.distance),
    };
  }
}
