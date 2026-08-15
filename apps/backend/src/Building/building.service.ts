import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Building, Venue } from '../entities/index';
import { DatabaseService } from '../db/database.service';
import { SessionData } from 'src/auth/session.decorator';
import {
  BuildingDto,
  BuildingListResponseDto,
  BuildingQueryDto,
  BuildingSingleResponseDto,
  CreateBuildingDto,
} from './dto/building.dto';
import { eq, ilike, isNotNull, isNull, sql, and } from 'drizzle-orm';

//building row return drizzle gives us
type BuildingEntity = typeof Building.$inferSelect;

@Injectable()
export class BuildingService {
  constructor(private readonly databaseService: DatabaseService) {}

  private requireUniId(session: SessionData): string {
    if (!session?.user) {
      throw new ForbiddenException('No active session');
    }

    if (!session?.uniId) {
      throw new ForbiddenException('No university selected');
    }

    return session?.uniId;
  }

  private buildingDtoAdapter(
    row: BuildingEntity,
    venueCount: number,
  ): BuildingDto {
    const buildingHasLocation = row.Latitude != null && row.Longitude != null;

    return {
      buildingId: row.BuildingID,
      buildingName: row.BuildingName,
      location: buildingHasLocation
        ? { lat: row.Latitude as number, lng: row.Longitude as number }
        : null,
      footprint: row.Footprint ?? null,
      icon: row.Icon,
      displayColour: row.DisplayColour,
      venueCount,
    };
  }

  async getAllBuildings(
    session: SessionData,
    query: BuildingQueryDto,
  ): Promise<BuildingListResponseDto> {
    const universityID = this.requireUniId(session);
    const database = this.databaseService.db;

    const filters = [eq(Building.UniversityID, universityID)];

    if (query.mapped === true) {
      filters.push(isNotNull(Building.Latitude));
    } else if (query.mapped === false) {
      filters.push(isNull(Building.Latitude));
    }

    if (query.search) {
      filters.push(ilike(Building.BuildingName, `%${query.search}%`));
    }

    const rows = await database
      .select({
        building: Building,
        venueCount: sql<number>`count(${Venue.VenueID})::int`,
      })
      .from(Building)
      .leftJoin(Venue, eq(Venue.BuildingID, Building.BuildingID))
      .where(and(...filters))
      .groupBy(Building.BuildingID)
      .orderBy(Building.BuildingID);

    return {
      buildings: rows.map((row) =>
        this.buildingDtoAdapter(row.building, row.venueCount),
      ),
    };
  }

  async createBuilding(
    session: SessionData,
    buildingDto: CreateBuildingDto,
  ): Promise<BuildingSingleResponseDto> {
    const universityId = this.requireUniId(session);
    const database = this.databaseService.db;

    //check if this building already exists
    const existingBuilding = await database
      .select({ id: Building.BuildingID })
      .from(Building)
      .where(
        and(
          eq(Building.UniversityID, universityId),
          eq(Building.BuildingID, buildingDto.buildingName),
        ),
      )
      .limit(1);

    if (existingBuilding.length > 0) {
      throw new ConflictException(
        `A building named "${buildingDto.buildingName}" already exists`,
      );
    }

    const [row] = await database
      .insert(Building)
      .values({
        UniversityID: universityId,
        BuildingName: buildingDto.buildingName,
        Latitude: buildingDto.location?.lat ?? null,
        Longitude: buildingDto.location?.lng ?? null,
        Footprint: buildingDto.footprint ?? null,
        Icon: buildingDto.icon ?? null,
        DisplayColour: buildingDto.displayColour ?? null,
        CreatedBy: session?.user.id,
      })
      .returning();

    return { building: this.buildingDtoAdapter(row, 0) };
  }
}
