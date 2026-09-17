import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Building,
  EventAttendance,
  EventVenue,
  ModuleEnrollment,
  UniversityEvent,
  Venue,
} from '../entities/index';
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
import {
  eq,
  and,
  isNotNull,
  isNull,
  ilike,
  sql,
  countDistinct,
  gte,
  lte,
  inArray,
} from 'drizzle-orm';
import { AppDatabase } from 'src/auth/auth';
import { UniversityService } from 'src/University/university.service';
import { VenueService } from 'src/Venue/venue.service';
import {
  BuildingHeatmapQueryDto,
  BuildingHeatmapResponseDto,
  BuildingHeatmapSummaryDto,
  BuildingHeatmapView_ENUM,
  VenueHeatmapDto,
} from './dto/heatmap.dto';
import { BaseVenueDto } from 'src/Venue/dto/venue.dto';

//building row return drizzle gives us
// type BuildingEntity = typeof Building.$inferSelect;

const DEFAULT_DISPLAY_COLOUR = '#808080'; //neutral grey

export type NormalizedBuildingHeatmapQuery = {
  from: string;
  to: string;
  view: BuildingHeatmapView_ENUM;
};

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
      await this.venueService.getAllVenues(uniId, { buildingId: buildingId })
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

  //Heatmaps
  async getHeatmap(
    uniId: string,
    buildingId: string,
    query: BuildingHeatmapQueryDto,
    tx?: AppDatabase,
  ): Promise<BuildingHeatmapResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.getHeatmap(uniId, buildingId, query, t);
      });
    }

    const validatedQuery: NormalizedBuildingHeatmapQuery =
      this.validateBuildingHeatmapQueryDto(query);

    //Get building and venues - throws 404
    const { building, venues } = await this.getById(uniId, buildingId, tx);

    //Get heatmap data for all venues of building
    const venuesHeatmap: VenueHeatmapDto[] = await this.getVenueHeatmapData(
      venues ?? [],
      validatedQuery,
      tx,
    );

    //Build heatmap summary for building
    const summary = this.buildHeatmapSummary(venuesHeatmap);

    return {
      building,
      period: {
        from: validatedQuery.from,
        to: validatedQuery.to,
      },
      summary,
      venues: venuesHeatmap,
    };
  } //END_getHeatmap

  // 🎅's little helpers

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
   * Validates and normalises an UpdateBuildingInput against the current building.
   *
   * Fields equal to the current value, or undefined, are stripped so the
   * downstream update only touches changed columns. Handles the three-state
   * pattern (undefined / null / value) for location, footprint and icon.
   * New building names are checked for uniqueness, ignoring self-matches.
   *
   * @param oldBuilding - The current building DTO.
   * @param input - The update payload to normalise.
   * @param tx - Active database transaction.
   * @returns The normalised input with unchanged fields removed.
   * @throws ConflictException when the new building name is taken by another building.
   */
  private async validateUpdateBuildingInput(
    oldBuilding: BaseBuildingDto,
    input: UpdateBuildingInput,
    tx: AppDatabase,
  ): Promise<UpdateBuildingInput> {
    //BuildingName
    if (
      input.BuildingName === undefined ||
      input.BuildingName === oldBuilding.BuildingName
    ) {
      delete input.BuildingName;
    } else {
      //Check name uniqueness against other buildings at the same university
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
          `Building name already exists for university`,
        );
      }
    }

    //Location - undefined means "don't touch", null means "clear pin", object means "set new"
    if (input.location === undefined) {
      delete input.location;
    } else if (input.location === null) {
      if (oldBuilding.location === null) {
        delete input.location;
      }
      // else: keep null (unpin)
    } else if (
      oldBuilding.location !== null &&
      input.location.lat === oldBuilding.location?.lat &&
      input.location.lng === oldBuilding.location?.lng
    ) {
      delete input.location;
    }
    // else: keep new location

    //Footprint — same three-state pattern
    if (input.footprint === undefined) {
      delete input.footprint;
    } else if (input.footprint === null) {
      if (oldBuilding.footprint === null) {
        delete input.footprint;
      }
    } else if (
      JSON.stringify(input.footprint) === JSON.stringify(oldBuilding.footprint)
    ) {
      delete input.footprint;
    }

    //Icon
    if (input.icon === undefined) {
      delete input.icon;
    } else if (input.icon === null) {
      if (oldBuilding.icon === null) {
        delete input.icon;
      }
    } else {
      const trimmed = input.icon.trim();
      if (trimmed.length === 0) {
        delete input.icon;
      } else if (trimmed === oldBuilding.icon) {
        delete input.icon;
      } else {
        input.icon = trimmed;
      }
    }

    //DisplayColour
    if (
      input.displayColour === undefined ||
      input.displayColour === oldBuilding.displayColour
    ) {
      delete input.displayColour;
    }

    return input;
  } //END_validateUpdateBuildingInput

  /** Normalises and validates a BuildingHeatmapQueryDto.
   *
   * `from` defaults to today and `to` defaults to `from` when absent, so an
   * empty query always produces a valid range.
   *
   * @param query - Raw heatmap query DTO from the request.
   * @returns Normalised query with `from`, `to` and `view` required.
   * @throws BadRequestException when `from` is after `to`.
   */
  private validateBuildingHeatmapQueryDto(
    query: BuildingHeatmapQueryDto,
  ): NormalizedBuildingHeatmapQuery {
    //From - default to today
    const from = query.from ?? new Date().toISOString().slice(0, 10);

    //To - defaut to from
    const to = query.to ?? from;

    //Validate range
    if (from > to) {
      this.OOPSIE.warn(
        `Invalid date range: from[${from}] must be <= to[${to}]`,
      );
      throw new BadRequestException(`Invalid date range`);
    } //END_Range check

    //validated in dto
    const view = query.view;

    return { from, to, view };
  } //END_validateBuildingHeatmapQueryDto

  /**
   * Builds per-venue heatmap metrics for a set of venues.
   *
   * Runs one aggregation query per attendance view.
   * Venues with no matching rows default to 0.
   * Utilisation ratios are are null when the venue's capacity is 0.
   *
   * @param venues - Venue rows to compute metrics for. Empty array returns early.
   * @param query - Normalised heatmap query (date range + view).
   * @param tx - database transaction.
   * @returns One VenueHeatmapDto per input venue.
   */
  private async getVenueHeatmapData(
    venues: BaseVenueDto[],
    query: NormalizedBuildingHeatmapQuery,
    tx: AppDatabase,
  ): Promise<VenueHeatmapDto[]> {
    //return early if no venues
    if (venues.length === 0) return [];

    //extract venue Ids
    const venueIds = venues.map((venue) => venue.VenueID);

    //View
    const shouldLoadProjected =
      query.view === BuildingHeatmapView_ENUM.PROJECTED ||
      query.view === BuildingHeatmapView_ENUM.ALL;

    const shouldLoadWorstCase =
      query.view === BuildingHeatmapView_ENUM.WORST_CASE ||
      query.view === BuildingHeatmapView_ENUM.ALL;
    //END_view

    const projectedByVenue = new Map<string, number>();
    const worstCaseByVenue = new Map<string, number>();

    //Projected
    if (shouldLoadProjected) {
      const projectedRows = await tx
        .select({
          VenueID: EventVenue.VenueID,
          projected: countDistinct(EventAttendance.UserID),
        })
        .from(EventVenue)
        .innerJoin(
          EventAttendance,
          and(
            eq(EventAttendance.eventID, EventVenue.EventID),
            eq(EventAttendance.state, 'ATTENDING'),
            gte(EventAttendance.eventDate, query.from),
            lte(EventAttendance.eventDate, query.to),
          ),
        )
        .where(inArray(EventVenue.VenueID, venueIds))
        .groupBy(EventVenue.VenueID);

      for (const row of projectedRows) {
        projectedByVenue.set(row.VenueID, Number(row.projected));
      } //END_row
    } //END_Projected

    //Worst Case
    if (shouldLoadWorstCase) {
      const worstCaseRows = await tx
        .select({
          VenueID: EventVenue.VenueID,
          worstCase: countDistinct(ModuleEnrollment.UserID),
        })
        .from(EventVenue)
        .innerJoin(
          UniversityEvent,
          eq(UniversityEvent.eventID, EventVenue.EventID),
        )
        .innerJoin(
          ModuleEnrollment,
          eq(ModuleEnrollment.ModuleID, UniversityEvent.moduleID),
        )
        .where(inArray(EventVenue.VenueID, venueIds))
        .groupBy(EventVenue.VenueID);

      for (const row of worstCaseRows) {
        worstCaseByVenue.set(row.VenueID, Number(row.worstCase));
      } //End_row
    } //END_worstCase

    //Format response
    return venues.map((v): VenueHeatmapDto => {
      const projected = projectedByVenue.get(v.VenueID) ?? 0;
      const worstCase = worstCaseByVenue.get(v.VenueID) ?? 0;

      const actual = null;

      return {
        VenueID: v.VenueID,
        VenueName: v.VenueName,
        Capacity: v.Capacity,
        projected,
        worstCase,
        actual,
        projectedUtilisation: this.calculateUtilisation(projected, v.Capacity),
        worstCaseUtilisation: this.calculateUtilisation(worstCase, v.Capacity),
      };
    }); //END_Return
  } //END_getVenueHeatmapData

  /** Computes the utilisation ratio of a venue.
   *
   * @param attendance - The attendance figure to divide.
   * @param capacity - The venue's capacity.
   * @returns attendance / capacity, or null when capacity is 0.
   */
  private calculateUtilisation(
    attendance: number,
    capacity: number,
  ): number | null {
    if (capacity === 0) {
      return null;
    }

    return attendance / capacity;
  } //END_calculateUtilisation

  /**
   * Aggregates venue heatmap metrics into a building-level summary.
   *
   * Capacity, projected and worstCase are summed across all venues. `actual`
   * is summed only if at least one venue has a non-null value, otherwise null.
   * Utilisation ratios are computed via `calculateUtilisation`.
   *
   * @param venues - Venue heatmap DTOs to aggregate.
   * @returns Building-level summary of the same metrics.
   */
  private buildHeatmapSummary(
    venues: VenueHeatmapDto[],
  ): BuildingHeatmapSummaryDto {
    //Capacity
    const Capacity = venues.reduce((total, venue) => total + venue.Capacity, 0);

    //projected
    const projected = venues.reduce(
      (total, venue) => total + venue.projected,
      0,
    );

    //Worst Case
    const worstCase = venues.reduce(
      (total, venue) => total + venue.worstCase,
      0,
    );

    //Actual Attendance
    const actualValues = venues
      .map((venue) => venue.actual)
      .filter((value): value is number => value !== null);

    const actual =
      actualValues.length > 0
        ? actualValues.reduce((total, value) => total + value, 0)
        : null;

    return {
      Capacity,
      projected,
      worstCase,
      actual,

      projectedUtilisation: this.calculateUtilisation(projected, Capacity),

      worstCaseUtilisation: this.calculateUtilisation(worstCase, Capacity),
    };
  } //END_buildHeatmapSummary
} //END_BuildingService
