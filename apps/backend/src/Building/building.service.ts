import {
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
  Event,
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
  AllBuildingsHeatmapResponseDto,
  HourlyHeatmapBucketDto,
} from './dto/heatmap.dto';
import { BaseVenueDto } from 'src/Venue/dto/venue.dto';
import { RecurringEventService } from 'src/Events/recurring-event.service';

//building row return drizzle gives us
// type BuildingEntity = typeof Building.$inferSelect;

const DEFAULT_DISPLAY_COLOUR = '#808080'; //neutral grey

export type NormalizedBuildingHeatmapQuery = {
  date: string;
  view: BuildingHeatmapView_ENUM;
};

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
    private readonly recurringEventService: RecurringEventService,
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
      date: validatedQuery.date,
      hourly: this.buildHourlySummary(venuesHeatmap),
      summary: summary,
      venues: venuesHeatmap,
    };
  } //END_getHeatmap

  //All buildings heatmaps
  async getAllBuildingsHeatmap(
    uniId: string,
    query: BuildingHeatmapQueryDto,
    tx?: AppDatabase,
  ): Promise<AllBuildingsHeatmapResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.getAllBuildingsHeatmap(uniId, query, t);
      });
    }

    const validateQuery = this.validateBuildingHeatmapQueryDto(query);
    const allBuildings = await this.getAll(uniId, {}, tx);
    const buildingHeatmaps: BuildingHeatmapResponseDto[] = [];

    for (const building of allBuildings.buildings) {
      const venues = (
        await this.venueService.getAllVenues(
          uniId,
          { buildingId: building.BuildingID },
          tx,
        )
      ).venues;

      const venuesHeatmap = await this.getVenueHeatmapData(
        venues,
        validateQuery,
        tx,
      );

      //something wrong here check
      buildingHeatmaps.push({
        building,
        date: validateQuery.date,
        hourly: this.buildHourlySummary(venuesHeatmap),
        summary: this.buildHeatmapSummary(venuesHeatmap),
        venues: venuesHeatmap,
      });
    }

    return { buildings: buildingHeatmaps };
  } //END_getAllBuildingsHeatmap

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

  private validateBuildingHeatmapQueryDto(
    query: BuildingHeatmapQueryDto,
  ): NormalizedBuildingHeatmapQuery {
    const date = query.date ?? new Date().toISOString().slice(0, 10);
    return { date, view: query.view };
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

    const occuringEventRows = await this.getOccuringEventRows(
      venueIds,
      query.date,
      tx,
    );
    const occuringEventIds = [
      ...new Set(occuringEventRows.map((row) => row.eventId)),
    ];

    const projectedByEvent = shouldLoadProjected
      ? await this.getProjectedCountsByEvent(occuringEventIds, query.date, tx)
      : new Map<string, number>();

    const worstCaseByEvent = shouldLoadWorstCase
      ? await this.getWorstCaseCountsByEvent(occuringEventIds, tx)
      : new Map<string, number>();

    const eventRowsByVenue = new Map<string, OccurringEventRow[]>();

    for (const row of occuringEventRows) {
      const existing = eventRowsByVenue.get(row.venueId) ?? [];
      existing.push(row);
      eventRowsByVenue.set(row.venueId, existing);
    }

    return venues.map((venue) =>
      this.buildVenueHeatmapFromEvents(
        venue,
        eventRowsByVenue.get(venue.VenueID) ?? [],
        projectedByEvent,
        worstCaseByEvent,
      ),
    );
  } //END_getVenueHeatmapData

  private getEventHours(startTime: string, endTime: string): number[] {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    const eventHours: number[] = [];

    for (let i = 0; i < 24; i++) {
      const hourStartMinutes = i * 60;
      const hourEndMinutesExclusive = hourStartMinutes + 60;

      if (
        startTotalMinutes < hourEndMinutesExclusive &&
        endTotalMinutes > hourStartMinutes
      ) {
        eventHours.push(i);
      }
    }

    return eventHours;
  }

  private async getOccuringEventRows(
    venueIds: string[],
    date: string,
    tx: AppDatabase,
  ): Promise<OccurringEventRow[]> {
    if (venueIds.length <= 0) {
      return [];
    }

    //check event table??
    const eventRows = await tx
      .select({
        venueId: EventVenue.VenueID,
        eventId: Event.eventID,
        eventCriteria: Event.eventCriteria,
        isRecurring: Event.isRecurring,
      })
      .from(EventVenue)
      .innerJoin(Event, eq(Event.eventID, EventVenue.EventID))
      .where(inArray(EventVenue.VenueID, venueIds));

    const occuringRows: OccurringEventRow[] = [];

    for (const i of eventRows) {
      const eventOccursToday = this.recurringEventService.occursOnDate(
        {
          eventId: i.eventId,
          eventCriteria: i.eventCriteria,
          isRecurring: i.isRecurring,
        },
        date,
      );

      if (!eventOccursToday) {
        continue;
      }

      occuringRows.push({
        venueId: i.venueId,
        eventId: i.eventId,
        linkedHours: this.getEventHours(
          i.eventCriteria.startTime,
          i.eventCriteria.endTime,
        ),
      });
    }

    return occuringRows;
  } //get_OccuringEventRows

  /**
   * Counts distinct students attending each event on a date.
   *
   * @param eventIds - Event IDs to count attendance for.
   * @param date - Date the attendance must match.
   * @param tx - Active database transaction.
   * @returns Map of event ID to attending student count. Empty when no event IDs provided.
   */
  private async getProjectedCountsByEvent(
    eventIds: string[],
    date: string,
    tx: AppDatabase,
  ): Promise<Map<string, number>> {
    const countsByEvent = new Map<string, number>();

    if (eventIds.length <= 0) {
      return countsByEvent;
    }

    const rows = await tx
      .select({
        eventId: EventAttendance.eventID,
        count: countDistinct(EventAttendance.UserID),
      })
      .from(EventAttendance)
      .where(
        and(
          inArray(EventAttendance.eventID, eventIds),
          eq(EventAttendance.state, 'ATTENDING'),
          eq(EventAttendance.eventDate, date),
        ),
      )
      .groupBy(EventAttendance.eventID);

    for (const row of rows) {
      countsByEvent.set(row.eventId, Number(row.count));
    }

    return countsByEvent;
  } //END_getProjectedCountsByEvent

  /**
   * Counts distinct enrolled students per event as the worst-case figure.
   *
   * @param eventIds - Event IDs to count enrolments for.
   * @param tx - Active database transaction.
   * @returns Map of event ID to enrolled student count. Empty when no event IDs provided.
   */
  private async getWorstCaseCountsByEvent(
    eventIds: string[],
    tx: AppDatabase,
  ): Promise<Map<string, number>> {
    const countsByEvent = new Map<string, number>();

    if (eventIds.length <= 0) {
      return countsByEvent;
    }

    const rows = await tx
      .select({
        eventId: UniversityEvent.eventID,
        count: countDistinct(ModuleEnrollment.UserID),
      })
      .from(UniversityEvent)
      .innerJoin(
        ModuleEnrollment,
        eq(ModuleEnrollment.ModuleID, UniversityEvent.moduleID),
      )
      .where(inArray(UniversityEvent.eventID, eventIds))
      .groupBy(UniversityEvent.eventID);

    for (const row of rows) {
      if (row.eventId === null) {
        continue;
      }

      countsByEvent.set(row.eventId, Number(row.count));
    }

    return countsByEvent;
  } //getWorstCaseCountsByEvent

  /**
   * Creates 24 empty hourly heatmap buckets (hours 0–23).
   *
   * @returns An array of 24 zeroed HourlyHeatmapBucketDto entries.
   */
  private createEmptyHourlyBuckets(): HourlyHeatmapBucketDto[] {
    const buckets: HourlyHeatmapBucketDto[] = [];

    for (let i = 0; i < 24; i++) {
      buckets.push({
        hour: i,
        Capacity: 0,
        projected: 0,
        worstCase: 0,
        actual: null,
        projectedUtilisation: null,
        worstCaseUtilisation: null,
      });
    }

    return buckets;
  } //END_createEmptyHourlyBuckets

  /**
   * Builds a VenueHeatmapDto for a venue from its occurring events
   *
   * @param venue - Venue the heatmap is being built for
   * @param eventsForVenue - Events occurring at this venue
   * @param projectedByEvent - Projected attendance keyed by event ID.
   * @param worstCaseByEvent - Worst-case attendance keyed by event ID
   * @returns The venue heatmap with daily and hourly metrics
   */
  private buildVenueHeatmapFromEvents(
    venue: BaseVenueDto,
    eventsForVenue: OccurringEventRow[],
    projectedByEvent: Map<string, number>,
    worstCaseByEvent: Map<string, number>,
  ): VenueHeatmapDto {
    const hourly = this.createEmptyHourlyBuckets();

    let dailyProjected = 0;
    let dailyWorstCase = 0;

    for (const row of eventsForVenue) {
      const eventProjected = projectedByEvent.get(row.eventId) ?? 0;
      const eventWorstCase = worstCaseByEvent.get(row.eventId) ?? 0;

      dailyProjected += eventProjected;
      dailyWorstCase += eventWorstCase;

      for (const hour of row.linkedHours) {
        hourly[hour].projected += eventProjected;
        hourly[hour].worstCase += eventWorstCase;
      }
    }

    for (const bucket of hourly) {
      bucket.Capacity = venue.Capacity;
      bucket.projectedUtilisation = this.calculateUtilisation(
        bucket.projected,
        venue.Capacity,
      );
      bucket.worstCaseUtilisation = this.calculateUtilisation(
        bucket.worstCase,
        venue.Capacity,
      );
    }

    return {
      VenueID: venue.VenueID,
      VenueName: venue.VenueName,
      Capacity: venue.Capacity,
      projected: dailyProjected,
      worstCase: dailyWorstCase,
      actual: null,
      projectedUtilisation: this.calculateUtilisation(
        dailyProjected,
        venue.Capacity,
      ),
      worstCaseUtilisation: this.calculateUtilisation(
        dailyWorstCase,
        venue.Capacity,
      ),
      hourly: hourly,
    };
  } //END_buildVenueHeatmapFromEvents

  /**
   * Builds per-venue heatmap metrics for a set of venues
   *
   * @param venues - Venue rows to compute metrics for
   * @param query - Normalised heatmap query
   * @param tx - Active database transaction
   * @returns One VenueHeatmapDto per input venue
   */
  private buildHourlySummary(
    venues: VenueHeatmapDto[],
  ): HourlyHeatmapBucketDto[] {
    const totalCapacity = venues.reduce(
      (total, venue) => total + venue.Capacity,
      0,
    );
    const buildingHourly: HourlyHeatmapBucketDto[] = [];

    //for each hour
    for (let i = 0; i < 24; i++) {
      let projected = 0;
      let worstCase = 0;

      for (const venue of venues) {
        const hour = venue.hourly[i];
        projected = projected + hour.projected;
        worstCase = worstCase + hour.worstCase;
      }

      buildingHourly.push({
        hour: i,
        Capacity: totalCapacity,
        projected: projected,
        worstCase: worstCase,
        actual: null,
        projectedUtilisation: this.calculateUtilisation(
          projected,
          totalCapacity,
        ),
        worstCaseUtilisation: this.calculateUtilisation(
          worstCase,
          totalCapacity,
        ),
      });
    }

    return buildingHourly;
  } //END_buildHourlySummary

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
