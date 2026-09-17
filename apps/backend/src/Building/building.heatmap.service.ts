import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/db/database.service';
import { RecurringEventService } from 'src/Events/recurring-event.service';
import { VenueService } from 'src/Venue/venue.service';
import {
  AllBuildingsHeatmapResponseDto,
  BuildingHeatmapQueryDto,
  BuildingHeatmapResponseDto,
  BuildingHeatmapSummaryDto,
  BuildingHeatmapView_ENUM,
  HourlyHeatmapBucketDto,
  VenueHeatmapDto,
} from './dto/heatmap.dto';
import { AppDatabase } from 'src/auth/auth';
import { BuildingService, OccurringEventRow } from './building.service';
import { BaseVenueDto } from 'src/Venue/dto/venue.dto';
import {
  Event,
  EventAttendance,
  EventVenue,
  ModuleEnrollment,
  UniversityEvent,
} from 'src/entities';
import { and, countDistinct, eq, inArray } from 'drizzle-orm';

export type NormalizedBuildingHeatmapQuery = {
  date: string;
  view: BuildingHeatmapView_ENUM;
};

@Injectable()
export class BuildingHeatmapService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly buildingService: BuildingService,
    private readonly venueService: VenueService,
    private readonly recEventService: RecurringEventService,
  ) {}

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
    const { building, venues } = await this.buildingService.getById(
      uniId,
      buildingId,
      tx,
    );

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
    const allBuildings = await this.buildingService.getAll(uniId, {}, tx);
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

  //🎅's little helpers

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
      const eventOccursToday = this.recEventService.occursOnDate(
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
} //END_BuildingHeatmapService
