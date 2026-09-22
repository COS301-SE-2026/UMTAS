import { Injectable } from '@nestjs/common';
import type { EventDto } from './dto/EventDto.dto';
import type { DayOfWeek, EventCriteria } from './dto/event.types';

//Event Id + date of occurance
export interface EventOccurrence {
  eventId: string;
  occurrenceDate: string;
}

export type EventForRecurrence = Pick<
  EventDto,
  'eventId' | 'eventCriteria' | 'isRecurring'
>;

//Indexes of days of week
const DAY_INDEX: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class RecurringEventService {
  /**
   * Determines whether an event occurs on the requested calendar date.
   *
   * @param event - Event to check.
   * @param requestedDate - Date in YYYY-MM-DD format.
   * @returns True if the event occurs on that date.
   */
  occursOnDate(event: EventForRecurrence, requestedDate: string): boolean {
    //Invalid date - return false
    if (!this.validateDate(requestedDate)) return false;

    const criteria = event.eventCriteria;

    //Recurring event - check day of week on that date
    if (event.isRecurring === true)
      return this.recurringEventOccursOnDate(criteria, requestedDate);

    //non recurring event- just check date
    return criteria.date === requestedDate;
  } //END_occursOnDate

  /**
   * Resolves the next occurrence on or after fromDate.
   *
   * @param event - Event to resolve.
   * @param fromDate - Earliest date to consider, in YYYY-MM-DD format.
   * @returns The next occurrence, or null if none.
   */
  resolveNextOccurrence(
    event: EventForRecurrence,
    fromDate: string,
  ): EventOccurrence | null {
    //Invalid date - return null
    if (!this.validateDate(fromDate)) return null;

    const criteria = event.eventCriteria;

    //get next occurance for recurring event
    if (event.isRecurring === true)
      return this.resolveNextRecurringOccurrence(
        event.eventId,
        criteria,
        fromDate,
      );

    //Invalid event date - return null
    if (!criteria.date || !this.validateDate(criteria.date)) return null;

    //If non recurring event is before input date - return null
    if (criteria.date < fromDate) return null;

    //Return EventOccurance object for non recurring event if valid
    return {
      eventId: event.eventId,
      occurrenceDate: criteria.date,
    };
  } //END_resolveNextOccurrence

  /**
   * Returns the occurrence for a requested date if the event occurs that day.
   *
   * @param event - Event to check.
   * @param requestedDate - Date in YYYY-MM-DD format.
   * @returns The occurrence, or null if the event does not occur that day.
   */
  resolveOccurrenceOnDate(
    event: EventForRecurrence,
    requestedDate: string,
  ): EventOccurrence | null {
    //If event does not occur on that date - return null
    if (!this.occursOnDate(event, requestedDate)) return null;

    return {
      eventId: event.eventId,
      occurrenceDate: requestedDate,
    };
  } //END_resolveOccurrenceOnDate

  //🎅's little helpers

  /**
   * Checks whether a recurring event's criteria match a requested date.
   *
   * @param criteria - Event criteria.
   * @param requestedDate - Date in YYYY-MM-DD format.
   * @returns True if the criteria's weekday matches the requested date.
   */
  private recurringEventOccursOnDate(
    criteria: EventCriteria,
    requestedDate: string,
  ): boolean {
    if (criteria.date || !criteria.dayOfWeek) {
      return false;
    }

    const targetDay = DAY_INDEX[criteria.dayOfWeek];

    if (targetDay === undefined) {
      return false;
    }

    return this.getDayOfWeek(requestedDate) === targetDay;
  } //END_recurringEventOccursOnDate

  /**
   * Finds the next date on or after fromDate that matches a recurring event.
   *
   * @param eventId - ID to attach to the occurrence.
   * @param criteria - Event criteria.
   * @param fromDate - Earliest date to consider.
   * @returns The next occurrence, or null if criteria are invalid.
   */
  private resolveNextRecurringOccurrence(
    eventId: string,
    criteria: EventCriteria,
    fromDate: string,
  ): EventOccurrence | null {
    if (criteria.date || !criteria.dayOfWeek) {
      return null;
    }

    const targetDay = DAY_INDEX[criteria.dayOfWeek];

    if (targetDay === undefined) {
      return null;
    }

    const currentDay = this.getDayOfWeek(fromDate);
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;

    const occurrenceDate = this.addDays(fromDate, daysUntilTarget);

    return {
      eventId,
      occurrenceDate,
    };
  } //END_resolveNextRecurringOccurance

  /**
   * Returns the day of week for a date, using UTC.
   *
   * @param dateOnly - Date in YYYY-MM-DD format.
   * @returns Day index (0 = Sunday, 6 = Saturday).
   */
  private getDayOfWeek(dateOnly: string): number {
    const [year, month, day] = this.parseDateOnly(dateOnly);

    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  } //END_getDayOfWeek

  /**
   * Adds a number of days to a date.
   *
   * @param dateOnly - Starting date in YYYY-MM-DD format.
   * @param numberOfDays - Days to add.
   * @returns The resulting date in YYYY-MM-DD format.
   */
  private addDays(dateOnly: string, numberOfDays: number): string {
    const [year, month, day] = this.parseDateOnly(dateOnly);
    const date = new Date(Date.UTC(year, month - 1, day));

    date.setUTCDate(date.getUTCDate() + numberOfDays);

    return date.toISOString().slice(0, 10);
  } //END_addDays

  /**
   * Validates that a string is a real calendar date in YYYY-MM-DD format.
   *
   * @param value - Value to check.
   * @returns True if valid.
   */
  private validateDate(value: string): boolean {
    if (!DATE_ONLY_PATTERN.test(value)) {
      return false;
    }

    const [year, month, day] = this.parseDateOnly(value);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  } //END_isValidDateOnly

  /**
   * Splits a YYYY-MM-DD string into numeric components.
   *
   * @param dateOnly - Date string.
   * @returns [year, month, day].
   */
  private parseDateOnly(dateOnly: string): [number, number, number] {
    const [year, month, day] = dateOnly.split('-').map(Number);

    return [year, month, day];
  } //END_parseDateOnly
} //END_RecurringEventService
