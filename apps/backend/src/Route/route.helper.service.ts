import { Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { AppDatabase } from 'src/auth/auth';
import { Event, EventAttendance, EventVenue, Venue } from 'src/entities';
import { RecurringEventService } from 'src/Events/recurring-event.service';
import { RouteEventContextDto } from './dto';
import { StudentEventRow } from './student-routing.service';

@Injectable()
export class RouteHelperService {
  constructor(private readonly recEventService: RecurringEventService) {}

  /**
   * Fetches all student events for a specific date.
   *
   * @param userId - Student's user ID
   * @param uniId - University to scope the query to
   * @param date - Date the events occur on
   * @param tx - transaction
   * @returns Deduplicated event rows occurring on the date.
   */
  async getStudentEventsForDate(
    userId: string,
    uniId: string,
    date: string,
    tx: AppDatabase,
  ): Promise<StudentEventRow[]> {
    const rows = await tx
      .select({
        eventId: Event.eventID,
        eventName: Event.eventName,
        eventCriteria: Event.eventCriteria,
        isRecurring: Event.isRecurring,
        venueId: Venue.VenueID,
        buildingId: Venue.BuildingID,
      })
      .from(EventAttendance)
      .innerJoin(Event, eq(Event.eventID, EventAttendance.eventID))
      .leftJoin(EventVenue, eq(EventVenue.EventID, Event.eventID))
      .leftJoin(Venue, eq(Venue.VenueID, EventVenue.VenueID))
      .where(
        and(
          eq(EventAttendance.UserID, userId),
          eq(EventAttendance.eventDate, date),
          eq(EventAttendance.state, 'ATTENDING'),
          eq(Venue.UniversityID, uniId),
        ),
      )
      .orderBy(asc(EventVenue.VenueID));

    return this.selectFirstVenuePerEvent(
      rows.map((row) => ({
        eventId: row.eventId,
        eventName: row.eventName,
        eventCriteria: row.eventCriteria,
        isRecurring: row.isRecurring,
        venueId: row.venueId,
        buildingId: row.buildingId,
      })),
      date,
    );
  } //END_getStudentEventsForDate

  /**
   * Filters events to those occurring on the requested date, keeping one per event ID.
   *
   * @param events - Student event rows to filter
   * @param requestedDate - Date to check occurrence against
   * @returns Events that occur on the date, deduplicated by event ID
   */
  selectFirstVenuePerEvent(
    events: StudentEventRow[],
    requestedDate: string,
  ): StudentEventRow[] {
    const eventsById = new Map<string, StudentEventRow>();

    for (const event of events) {
      const occursOnDate = this.recEventService.occursOnDate(
        {
          eventId: event.eventId,
          eventCriteria: event.eventCriteria,
          isRecurring: event.isRecurring,
        },
        requestedDate,
      );

      if (!occursOnDate) {
        continue;
      }

      if (!eventsById.has(event.eventId)) {
        eventsById.set(event.eventId, event);
      }
    } //END_event

    return [...eventsById.values()];
  } //END_selectFirstVenuePerEvent

  /**
   * Compares two event contexts for sorting
   *
   * Orders by startTime, then by eventId.
   *
   * @param l - Left
   * @param r - Right
   * @returns Negative if l sorts first, positive if r sorts first, 0 if equal
   */
  compareEventContexts(
    l: RouteEventContextDto,
    r: RouteEventContextDto,
  ): number {
    const startTimeComparison = l.startTime.localeCompare(r.startTime);

    if (startTimeComparison !== 0) {
      return startTimeComparison;
    }

    return l.eventId.localeCompare(r.eventId);
  } //END_compareEventContexts

  /**
   * Maps a student event row to a route event context
   *
   * @param event - Student event row to map
   * @param occurrenceDate - Date of the occurrence to attach
   * @returns The route event context
   */
  toEventContext(
    event: StudentEventRow,
    occurrenceDate: string,
  ): RouteEventContextDto {
    return {
      eventId: event.eventId,
      eventName: event.eventName,
      occurrenceDate,
      startTime: event.eventCriteria.startTime,
      endTime: event.eventCriteria.endTime,
      venueId: event.venueId,
      buildingId: event.buildingId,
    };
  } //END_toEventContext
} //END_RouteHelperService
