import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Building, Venue } from '../entities/index';
import { DatabaseService } from '../db/database.service';
import {
  BaseBuildingDto,
  BuildingDto,
  BuildingListResponseDto,
  BuildingQueryDto,
  BuildingSingleResponseDto,
  CreateBuildingInput,
  UpdateBuildingDto,
  UpdateBuildingInput,
} from './dto/building.dto';
import { eq, and, isNotNull, isNull, ilike, sql } from 'drizzle-orm';
import { AppDatabase } from 'src/auth/auth';
import { UniversityService } from 'src/University/university.service';
import { VenueService } from 'src/Venue/venue.service';

const DEFAULT_DISPLAY_COLOUR = '#808080'; //neutral grey

export interface OccurringEventRow {
  venueId: string;
  eventId: string;
  linkedHours: number[];
}

@Injectable()
export class BuildingService {
  private readonly OOPSIE = new Logger(this.constructor.name);

  constructor(
    private readonly dbService: DatabaseService,
    private readonly uniService: UniversityService,
    @Inject(forwardRef(() => VenueService))
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

    return {
      building: this.buildingDtoAdapter(building, 0),
      venues: [],
    };
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
    const venues = (
      await this.venueService.getAllVenues(
        uniId,
        { buildingId: buildingId },
        tx,
      )
    ).venues;
    const response: BuildingSingleResponseDto = {
      building: this.buildingDtoAdapter(building, venues.length),
      venues,
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
  async update(
    uniId: string,
    buildingId: string,
    input: UpdateBuildingInput,
    tx?: AppDatabase,
  ): Promise<BuildingSingleResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.update(uniId, buildingId, input, t);
      });
    }

    //Fetch old building - throws 404 if not exists
    const { building: oldBuilding, venues } = await this.getById(
      uniId,
      buildingId,
      tx,
    );

    const updateFields: Partial<UpdateBuildingDto> =
      await this.validateUpdateBuildingInput(oldBuilding, input, tx);

    //No fields to update -> return early
    if (Object.keys(updateFields).length === 0) {
      return { building: oldBuilding };
    }

    //Update building
    const [building] = await tx
      .update(Building)
      .set({
        ...(updateFields.BuildingName !== undefined && {
          BuildingName: updateFields.BuildingName,
        }),
        ...(updateFields.location !== undefined && {
          Latitude: updateFields.location?.lat ?? null,
          Longitude: updateFields.location?.lng ?? null,
        }),
        ...(updateFields.footprint !== undefined && {
          Footprint: updateFields.footprint,
        }),
        ...(updateFields.icon !== undefined && { Icon: updateFields.icon }),
        ...(updateFields.displayColour !== undefined && {
          DisplayColour: updateFields.displayColour,
        }),
      })
      .where(eq(Building.BuildingID, buildingId))
      .returning();

    if (!building) {
      this.OOPSIE.fatal(
        `Failed to update building[${JSON.stringify(oldBuilding)}] with fields[${JSON.stringify(updateFields)}]`,
      );
      throw new InternalServerErrorException(`Failed to update building`);
    }

    return { building: this.buildingDtoAdapter(building, venues?.length ?? 0) };
  } //END_update

  //Delete
  async delete(
    buildingId: string,
    tx?: AppDatabase,
  ): Promise<BuildingSingleResponseDto> {
    const db = tx ?? this.dbService.db;

    //Delete building
    const [building] = await db
      .delete(Building)
      .where(eq(Building.BuildingID, buildingId))
      .returning();

    if (!building) {
      this.OOPSIE.fatal(`Failed to delete building[${buildingId}]`);
      throw new NotFoundException(`Failed to delete building`);
    }

    return { building: this.buildingDtoAdapter(building, 0) };
  } //END_delete

  // 🎅's little helpers
  /**
   * Maps a raw Building row to a BuildingDto.
   *
   * Collapses Latitude/Longitude into a location object (null when either is
   * missing). All other fields pass through unchanged.
   *
   * @param row - Raw Building row from the database.
   * @param venueCount - Number of venues attached to this building.
   * @returns The mapped BuildingDto.
   */
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
  } //END_buildingDtoAdapter

  /**
   * Validates and normalises a CreateBuildingInput.
   *
   * Ensures the university exists and the building name is unique within it.
   * Defaults location, footprint and icon to null, and displayColour to the
   * default colour when absent. Trims icon and nulls it if blank.
   *
   * @param input - The create payload to validate.
   * @param tx - Active database transaction.
   * @returns The normalised input.
   * @throws NotFoundException when the university does not exist.
   * @throws ConflictException when the building name is taken.
   */
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
    const icon = input.icon?.trim();
    if (icon !== undefined && icon?.length > 0) {
      input.icon = icon;
    } else {
      input.icon = null;
    }

    //DisplayColour — normalise to null if absent
    if (!input.displayColour) {
      input.displayColour = DEFAULT_DISPLAY_COLOUR;
    }

    return input;
  } //END_validateCreateBuildingInput

  /**
   * Fetches a building with the given name for a university.
   *
   * @param buildingName - Name to search for.
   * @param uniId - University to scope the search to.
   * @param tx - Active database transaction.
   * @returns The building wrapped in a response DTO, or null if none found.
   */
  private async uniqueBuildingNamePerUniversity(
    buildingName: string,
    uniId: string,
    tx: AppDatabase,
  ): Promise<BaseBuildingDto | null> {
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

    return building ? building : null;
  } //END_uniqueBuildingNamePerUniversity

  /**
   * Validates and normalises an UpdateBuildingInput against the current building
   *
   * @param oldBuilding - The current building DTO
   * @param input - The update payload to normalise
   * @param tx - Active database transaction
   * @returns The normalised input with unchanged fields removed
   * @throws ConflictException when the new building name is taken by another building.
   */
  private async validateUpdateBuildingInput(
    oldBuilding: BaseBuildingDto,
    input: UpdateBuildingInput,
    tx: AppDatabase,
  ): Promise<UpdateBuildingInput> {
    await this.validateBuildingNameUpdate(oldBuilding, input, tx);

    this.validateLocationUpdate(oldBuilding, input);
    this.validateFootprintUpdate(oldBuilding, input);
    this.validateIconUpdate(oldBuilding, input);
    this.validateDisplayColourUpdate(oldBuilding, input);

    return input;
  } //END_validateUpdateBuildingInput

  private async validateBuildingNameUpdate(
    oldBuilding: BaseBuildingDto,
    input: UpdateBuildingInput,
    tx: AppDatabase,
  ): Promise<void> {
    if (
      input.BuildingName === undefined ||
      input.BuildingName === oldBuilding.BuildingName
    ) {
      delete input.BuildingName;
      return;
    }

    const duplicate = await this.uniqueBuildingNamePerUniversity(
      input.BuildingName,
      oldBuilding.UniversityID,
      tx,
    );

    if (duplicate && duplicate.BuildingID !== oldBuilding.BuildingID) {
      this.OOPSIE.warn(
        `Building[${input.BuildingName}] already exists for university[${oldBuilding.UniversityID}]`,
      );

      throw new ConflictException(
        'Building name already exists for university',
      );
    }
  } //END_validateBuidlingNameUpdate

  private validateLocationUpdate(
    oldBuilding: BaseBuildingDto,
    input: UpdateBuildingInput,
  ): void {
    if (input.location === undefined) {
      delete input.location;
      return;
    }

    if (input.location === null) {
      if (oldBuilding.location === null) {
        delete input.location;
      }
      return;
    }

    if (
      oldBuilding.location !== null &&
      input.location.lat === oldBuilding.location?.lat &&
      input.location.lng === oldBuilding.location?.lng
    ) {
      delete input.location;
    }
  } //END_validateLocationUpdate

  private validateFootprintUpdate(
    oldBuilding: BaseBuildingDto,
    input: UpdateBuildingInput,
  ): void {
    if (input.footprint === undefined) {
      delete input.footprint;
      return;
    }

    if (input.footprint === null) {
      if (oldBuilding.footprint === null) {
        delete input.footprint;
      }
      return;
    }

    if (
      JSON.stringify(input.footprint) === JSON.stringify(oldBuilding.footprint)
    ) {
      delete input.footprint;
    }
  } //END_validateFootprintUpdate

  private validateIconUpdate(
    oldBuilding: BaseBuildingDto,
    input: UpdateBuildingInput,
  ): void {
    if (input.icon === undefined) {
      delete input.icon;
      return;
    }

    if (input.icon === null) {
      if (oldBuilding.icon === null) {
        delete input.icon;
      }
      return;
    }

    const trimmed = input.icon.trim();

    if (trimmed === oldBuilding.icon || trimmed.length === 0) {
      delete input.icon;
      return;
    }

    input.icon = trimmed;
  } //END_validateIconUpdate

  private validateDisplayColourUpdate(
    oldBuilding: BaseBuildingDto,
    input: UpdateBuildingInput,
  ): void {
    if (
      input.displayColour === undefined ||
      input.displayColour === oldBuilding.displayColour
    ) {
      delete input.displayColour;
    }
  } //END_validateDisplayColourUpdate
} //END_BuildingService
