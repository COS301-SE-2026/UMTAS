import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Building, Venue } from '../entities/index';
import { DatabaseService } from '../db/database.service';
import {
  BuildingDto,
  BuildingListResponseDto,
  BuildingQueryDto,
  BuildingSingleResponseDto,
  CreateBuildingInput,
} from './dto/building.dto';
import { eq, and, isNotNull, isNull, ilike, sql } from 'drizzle-orm';
import { AppDatabase } from 'src/auth/auth';
import { UniversityService } from 'src/University/university.service';
import { VenueService } from 'src/Venue/venue.service';

//building row return drizzle gives us
// type BuildingEntity = typeof Building.$inferSelect;

const DEFAULT_DISPLAY_COLOUR = '#808080'; //neutral grey

@Injectable()
export class BuildingService {
  private readonly OOPSIE = new Logger(this.constructor.name);

  constructor(
    private readonly dbService: DatabaseService,
    private readonly uniService: UniversityService,
    private readonly venueService: VenueService,
  ) {}

  //Create
  async create(
    input: CreateBuildingInput,
    tx?: AppDatabase,
  ): Promise<BuildingSingleResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.create(input, t);
      }); //END_transaction
    }

    //Validate createbuidlingInput
    await this.validateCreateBuildingInput(input, tx);

    const [building] = await tx
      .insert(Building)
      .values({
        UniversityID: input.UniversityID,
        BuildingName: input.BuildingName,
        Latitude: input.location?.lat ?? null,
        Longitude: input.location?.lng ?? null,
        Footprint: input.footprint ?? null,
        Icon: input.icon ?? null,
        DisplayColour: input.displayColour ?? null,
        CreatedBy: input.CreatedBy,
      })
      .returning();

    if (!building) {
      this.OOPSIE.fatal(
        `Failed to create building with input[${JSON.stringify(input)}]`,
      );
      throw new InternalServerErrorException(`Failed to create building`);
    }

    return { building, venues: [] };
  } //END_createBuilding

  //GetById
  async getById(
    uniId: string,
    buildingId: string,
    tx?: AppDatabase,
  ): Promise<BuildingSingleResponseDto> {
    const db = tx ?? this.dbService.db;

    //Fetch building by id
    const [building] = await db
      .select()
      .from(Building)
      .where(
        and(
          eq(Building.BuildingID, buildingId),
          eq(Building.UniversityID, uniId),
        ),
      )
      .limit(1);

    if (!building) {
      this.OOPSIE.warn(`Building[${buildingId}] not found`);
      throw new NotFoundException(`Building not found`);
    }

    //Attach venues
    const response: BuildingSingleResponseDto = {
      building,
      venues: (
        await this.venueService.getAllVenues(uniId, { buildingId: buildingId })
      ).venues,
    };

    return response;
  } //END_getById

  //GetAll
  async getAll(
    uniId: string,
    query: BuildingQueryDto,
    tx?: AppDatabase,
  ): Promise<BuildingListResponseDto> {
    const db = tx ?? this.dbService.db;

    const filters = [eq(Building.UniversityID, uniId)];

    if (query.mapped === true) {
      filters.push(isNotNull(Building.Latitude));
    } else if (query.mapped === false) {
      filters.push(isNull(Building.Latitude));
    }

    if (query.search) {
      filters.push(ilike(Building.BuildingName, `%${query.search}%`));
    }

    const rows = await db
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
      buildings: rows.map((r) =>
        this.buildingDtoAdapter(r.building, r.venueCount),
      ),
    };
  } //END_getAllBuildings

  //Update
  // async updateBuildingLocation(
  //   session: SessionData,
  //   buildingID: string,
  //   updateBuildingLocationDto: UpdateBuildingLocationDto,
  // ): Promise<BuildingSingleResponseDto> {
  //   const database = this.dbService.db;

  //   const [existingBuilding] = await database
  //     .select()
  //     .from(Building)
  //     .where(
  //       and(
  //         eq(Building.BuildingID, buildingID),
  //         eq(Building.UniversityID, universityId),
  //       ),
  //     )
  //     .limit(1);

  //   if (!existingBuilding) {
  //     throw new NotFoundException('Building could not be found');
  //   }

  //   //everything is optional
  //   const updateValues: Partial<typeof Building.$inferInsert> = {};

  //   //only update what was sent
  //   if (updateBuildingLocationDto.location != undefined) {
  //     updateValues.Latitude = updateBuildingLocationDto.location?.lat ?? null;
  //     updateValues.Longitude = updateBuildingLocationDto.location?.lng ?? null;
  //   }

  //   //only update what was sent
  //   if (updateBuildingLocationDto.footprint != undefined) {
  //     updateValues.Footprint = updateBuildingLocationDto.footprint;
  //   }

  //   const [row] = await database
  //     .update(Building)
  //     .set(updateValues)
  //     .where(eq(Building.BuildingID, buildingID))
  //     .returning();

  //   const [{ venueCount }] = await database
  //     .select({ venueCount: count(Venue.VenueID) })
  //     .from(Venue)
  //     .where(eq(Venue.BuildingID, buildingID));

  //   return { building: this.buildingDtoAdapter(row, venueCount) };
  // }//END_updateBuilding

  //Delete

  // 🎅's little helpers
  private async validateCreateBuildingInput(
    input: CreateBuildingInput,
    tx: AppDatabase,
  ): Promise<CreateBuildingInput> {
    //Validate university - throws 404
    await this.uniService.getById(input.UniversityID, tx);

    //BuildingName - unique per university - throws conflict exception
    const conflict = await this.uniqueBuildingNamePerUniversity(
      input.BuildingName,
      input.UniversityID,
      tx,
    );
    if (conflict) {
      this.OOPSIE.warn(
        `Building[${input.BuildingName}] already exists for university[${input.UniversityID}]`,
      );
      throw new ConflictException(
        `Building name already exists for university`,
      );
    }

    //Location - null if absent
    if (!input.location) {
      input.location = null;
    }

    //Footprint - null if absent
    if (!input.footprint) {
      input.footprint = null;
    }

    //Icon
    if (input.icon !== undefined && input.icon !== null) {
      const trimmed = input.icon.trim();
      input.icon = trimmed.length > 0 ? trimmed : null;
    } else {
      input.icon = null;
    }

    //DisplayColour — normalise to null if absent
    if (!input.displayColour) {
      input.displayColour = DEFAULT_DISPLAY_COLOUR;
    }

    return input;
  } //END_validateCreateBuildingInput

  private async uniqueBuildingNamePerUniversity(
    buildingName: string,
    uniId: string,
    tx: AppDatabase,
  ): Promise<BuildingSingleResponseDto | null> {
    //Check if another building with same name for university already exists
    const [building] = await tx
      .select()
      .from(Building)
      .where(
        and(
          eq(Building.BuildingName, buildingName),
          eq(Building.UniversityID, uniId),
        ),
      )
      .limit(1);

    return building ? { building } : null;
  } //END_uniqueBuildingNamePerUniversity

  private buildingDtoAdapter(
    row: typeof Building.$inferSelect,
    venueCount: number,
  ): BuildingDto {
    return {
      BuildingID: row.BuildingID,
      BuildingName: row.BuildingName,
      UniversityID: row.UniversityID,
      location:
        row.Latitude !== null && row.Longitude !== null
          ? { lat: row.Latitude, lng: row.Longitude }
          : null,
      footprint: row.Footprint,
      icon: row.Icon,
      displayColour: row.DisplayColour,
      venueCount,
    };
  }
}
