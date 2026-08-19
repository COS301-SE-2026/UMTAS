import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
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
  UpdateBuildingLocationDto,
} from './dto/building.dto';
import { eq, ilike, isNotNull, isNull, sql, and, count } from 'drizzle-orm';

//building row return drizzle gives us
type BuildingEntity = typeof Building.$inferSelect;

@Injectable()
export class BuildingService {
  constructor(private readonly databaseService: DatabaseService) {}

  private requireUniId(session: SessionData | undefined): string {
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
          eq(Building.BuildingName, buildingDto.buildingName),
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

  async updateBuildingLocation(
    session: SessionData,
    buildingID: string,
    updateBuildingLocationDto: UpdateBuildingLocationDto,
  ): Promise<BuildingSingleResponseDto> {
    const universityId = this.requireUniId(session);
    const database = this.databaseService.db;

    const [existingBuilding] = await database
      .select()
      .from(Building)
      .where(
        and(
          eq(Building.BuildingID, buildingID),
          eq(Building.UniversityID, universityId),
        ),
      )
      .limit(1);

    if (!existingBuilding) {
      throw new NotFoundException('Building could not be found');
    }

    //everything is optional
    const updateValues: Partial<typeof Building.$inferInsert> = {};

    //only update what was sent
    if (updateBuildingLocationDto.location != undefined) {
      updateValues.Latitude = updateBuildingLocationDto.location?.lat ?? null;
      updateValues.Longitude = updateBuildingLocationDto.location?.lng ?? null;
    }

    //only update what was sent
    if (updateBuildingLocationDto.footprint != undefined) {
      updateValues.Footprint = updateBuildingLocationDto.footprint;
    }

    const [row] = await database
      .update(Building)
      .set(updateValues)
      .where(eq(Building.BuildingID, buildingID))
      .returning();

    const [{ venueCount }] = await database
      .select({ venueCount: count(Venue.VenueID) })
      .from(Venue)
      .where(eq(Venue.BuildingID, buildingID));

    return { building: this.buildingDtoAdapter(row, venueCount) };
  }
}
