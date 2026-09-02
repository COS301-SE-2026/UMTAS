import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import type { ActivityType } from 'shared-types';
import type {
  AcademicCalendarRecord,
  CalendarRestrictionType,
  CalendarRestrictionRecord,
  Weekday,
} from '../entities';
import {
  addDays,
  dateFromDomain,
  domainDate,
  firstWeekdayOnOrAfter,
  lastWeekdayOnOrBefore,
  weekdayForDate,
} from '../entities/AcademicCalendar/date.utils';
import type { AcademicSemesterType } from '../entities/Modules/modules.schema';
import type { EventCriteria } from '../Events/dto/event.types';
import type {
  GeneratedAllDayEventDto,
  GeneratedCalendarPayloadDto,
  GeneratedCalendarWarningDto,
  GeneratedOneOffEventDto,
  GeneratedRecurringEventDto,
} from './dto';

export type CalendarSourceEvent = {
  id: string;
  name: string;
  activityCode: string | null;
  activityType: string | null;
  criteria: EventCriteria;
  isRecurring: boolean;
  moduleId: string | null;
  moduleCode: string | null;
  moduleName: string | null;
  semester: AcademicSemesterType | null;
  moduleColour: string | null;
  venues: string[];
};

type SemesterBounds = Record<
  'SEMESTER_1' | 'SEMESTER_2',
  { start: string; end: string }
>;

const TEACHING_ACTIVITY_TYPES = new Set<ActivityType>([
  'lecture',
  'tutorial',
  'prac',
]);
const TEACHING_BLACKOUT_TYPES = new Set<CalendarRestrictionType>([
  'HOLIDAY',
  'PUBLIC_HOLIDAY',
  'UNIVERSITY_CLOSURE',
  'RECESS',
  'TEST_WEEK',
  'EXAM_PERIOD',
  'SUPP_WEEK',
]);
const DISPLAYED_ALL_DAY_TYPES = new Set<CalendarRestrictionType>([
  'HOLIDAY',
  'PUBLIC_HOLIDAY',
  'UNIVERSITY_CLOSURE',
  'RECESS',
  'TEST_WEEK',
  'EXAM_PERIOD',
  'SUPP_WEEK',
]);

@Injectable()
export class AcademicCalendarGenerationService {
  build(
    calendar: AcademicCalendarRecord,
    timetableName: string | null,
    restrictions: CalendarRestrictionRecord[],
    events: CalendarSourceEvent[],
  ): GeneratedCalendarPayloadDto {
    const bounds = this.getSemesterBounds(restrictions);
    const warnings: GeneratedCalendarWarningDto[] = [];
    const recurringEvents: GeneratedRecurringEventDto[] = [];
    const oneOffEvents: GeneratedOneOffEventDto[] = [];

    for (const event of [...events].sort((a, b) => a.id.localeCompare(b.id))) {
      if (event.isRecurring) {
        const recurring = this.toRecurringEvent(
          event,
          bounds,
          restrictions,
          warnings,
        );
        if (recurring) recurringEvents.push(recurring);
      } else {
        const oneOff = this.toOneOffEvent(
          event,
          calendar.year,
          restrictions,
          warnings,
        );
        if (oneOff) oneOffEvents.push(oneOff);
      }
    }

    return {
      name: timetableName?.trim() || `Academic Calendar ${calendar.year}`,
      year: calendar.year,
      recurringEvents: recurringEvents.sort((a, b) =>
        a.key.localeCompare(b.key),
      ),
      oneOffEvents: oneOffEvents.sort(
        (a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key),
      ),
      allDayEvents: restrictions
        .filter((restriction) => DISPLAYED_ALL_DAY_TYPES.has(restriction.type))
        .map((restriction) => this.toAllDayEvent(restriction))
        .sort(
          (a, b) =>
            a.startDate.localeCompare(b.startDate) ||
            a.endDate.localeCompare(b.endDate) ||
            a.key.localeCompare(b.key),
        ),
      warnings: warnings.sort(
        (a, b) =>
          (a.sourceId ?? '').localeCompare(b.sourceId ?? '') ||
          a.code.localeCompare(b.code) ||
          a.message.localeCompare(b.message),
      ),
    };
  }

  private getSemesterBounds(
    restrictions: CalendarRestrictionRecord[],
  ): SemesterBounds {
    const boundary = (
      type:
        | 'SEMESTER_1_START'
        | 'SEMESTER_1_END'
        | 'SEMESTER_2_START'
        | 'SEMESTER_2_END',
    ): string => {
      const matches = restrictions.filter((item) => item.type === type);
      if (matches.length !== 1) {
        throw new UnprocessableEntityException(
          `Academic calendar requires exactly one ${type} restriction`,
        );
      }
      return type.endsWith('_END') ? matches[0].endDate : matches[0].startDate;
    };

    const bounds: SemesterBounds = {
      SEMESTER_1: {
        start: boundary('SEMESTER_1_START'),
        end: boundary('SEMESTER_1_END'),
      },
      SEMESTER_2: {
        start: boundary('SEMESTER_2_START'),
        end: boundary('SEMESTER_2_END'),
      },
    };
    if (
      bounds.SEMESTER_1.start > bounds.SEMESTER_1.end ||
      bounds.SEMESTER_2.start > bounds.SEMESTER_2.end ||
      bounds.SEMESTER_1.end >= bounds.SEMESTER_2.start
    ) {
      throw new UnprocessableEntityException(
        'Academic calendar semester boundaries overlap or are out of order',
      );
    }
    return bounds;
  }

  private toRecurringEvent(
    event: CalendarSourceEvent,
    bounds: SemesterBounds,
    restrictions: CalendarRestrictionRecord[],
    warnings: GeneratedCalendarWarningDto[],
  ): GeneratedRecurringEventDto | null {
    const isTeaching = this.isTeachingActivity(event.activityType);
    const day = event.criteria.dayOfWeek;
    if (
      !day ||
      !this.isValidTimeRange(event.criteria.startTime, event.criteria.endTime)
    ) {
      warnings.push({
        code: 'RECURRING_EVENT_CRITERIA_INVALID',
        message: `${event.name} has a missing or invalid weekday/time range.`,
        sourceId: event.id,
      });
      return null;
    }

    const ranges =
      !isTeaching || !event.semester
        ? [{ start: bounds.SEMESTER_1.start, end: bounds.SEMESTER_2.end }]
        : event.semester === 'YEAR'
          ? [bounds.SEMESTER_1, bounds.SEMESTER_2]
          : [bounds[event.semester]];
    const startsOn = firstWeekdayOnOrAfter(ranges[0].start, day);
    const endsOn = lastWeekdayOnOrBefore(ranges.at(-1)!.end, day);
    if (startsOn > endsOn) {
      warnings.push({
        code: 'RECURRING_EVENT_OUTSIDE_SEMESTER',
        message: `${event.name} has no occurrence inside its module semester.`,
        sourceId: event.id,
      });
      return null;
    }

    const excludedDates = new Set<string>();
    const additionalDates = new Set<string>();
    for (const date of this.weekdayDates(startsOn, endsOn, day)) {
      if (!ranges.some((range) => date >= range.start && date <= range.end)) {
        excludedDates.add(date);
      } else if (isTeaching && this.isTeachingBlackout(date, restrictions)) {
        excludedDates.add(date);
      }
    }

    if (isTeaching) {
      for (const restriction of restrictions.filter(
        (item) => item.type === 'DAY_SWAP',
      )) {
        const date = restriction.startDate;
        if (
          !ranges.some((range) => date >= range.start && date <= range.end) ||
          this.isTeachingBlackout(date, restrictions)
        ) {
          continue;
        }

        if (weekdayForDate(date).toLowerCase() === day) {
          excludedDates.add(date);
        }
        if (restriction.replacementWeekday?.toLowerCase() === day) {
          additionalDates.add(date);
        }
      }
    }

    const description = this.eventDescription(event);
    return {
      key: `event-${event.id}`,
      title: this.eventTitle(event),
      ...(description ? { description } : {}),
      ...(event.venues.length
        ? { location: [...event.venues].sort().join(', ') }
        : {}),
      ...(event.moduleId ? { moduleId: event.moduleId } : {}),
      ...(event.moduleColour ? { moduleColour: event.moduleColour } : {}),
      startTime: event.criteria.startTime,
      endTime: event.criteria.endTime,
      weekday: day.toUpperCase() as Weekday,
      startsOn,
      endsOn,
      excludedDates: [...excludedDates].sort(),
      additionalDates: [...additionalDates].sort(),
    };
  }

  private toOneOffEvent(
    event: CalendarSourceEvent,
    calendarYear: number,
    restrictions: CalendarRestrictionRecord[],
    warnings: GeneratedCalendarWarningDto[],
  ): GeneratedOneOffEventDto | null {
    const { date, startTime, endTime } = event.criteria;
    if (
      !date ||
      !this.isDomainDate(date) ||
      !this.isValidTimeRange(startTime, endTime)
    ) {
      warnings.push({
        code: 'ONE_OFF_EVENT_CRITERIA_INVALID',
        message: `${event.name} has a missing or invalid date/time range.`,
        sourceId: event.id,
      });
      return null;
    }
    if (!date.startsWith(`${calendarYear}-`)) {
      warnings.push({
        code: 'ONE_OFF_EVENT_OUTSIDE_CALENDAR',
        message: `${event.name} falls outside academic calendar year ${calendarYear}.`,
        sourceId: event.id,
      });
      return null;
    }
    if (
      this.isTeachingActivity(event.activityType) &&
      this.isTeachingBlackout(date, restrictions)
    ) {
      return null;
    }

    const description = this.eventDescription(event);
    return {
      key: `event-${event.id}`,
      title: this.eventTitle(event),
      ...(description ? { description } : {}),
      ...(event.venues.length
        ? { location: [...event.venues].sort().join(', ') }
        : {}),
      ...(event.moduleId ? { moduleId: event.moduleId } : {}),
      ...(event.moduleColour ? { moduleColour: event.moduleColour } : {}),
      date,
      startTime,
      endTime,
    };
  }

  private toAllDayEvent(
    restriction: CalendarRestrictionRecord,
  ): GeneratedAllDayEventDto {
    const hasDescription = Boolean(restriction.description.trim());
    return {
      key: `restriction-${restriction.id}`,
      title: hasDescription
        ? restriction.description.trim()
        : this.humanize(restriction.type),
      ...(hasDescription
        ? { description: this.humanize(restriction.type) }
        : {}),
      type: restriction.type,
      startDate: restriction.startDate,
      endDate: restriction.endDate,
    };
  }

  private isTeachingBlackout(
    date: string,
    restrictions: CalendarRestrictionRecord[],
  ): boolean {
    return restrictions.some(
      (restriction) =>
        TEACHING_BLACKOUT_TYPES.has(restriction.type) &&
        date >= restriction.startDate &&
        date <= restriction.endDate,
    );
  }

  private eventTitle(event: CalendarSourceEvent): string {
    const module = (event.moduleCode ?? event.criteria.moduleId)?.trim();
    const name = event.name.trim();
    if (!module) return name;

    const escapedModule = module.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const repeatedModulePrefix = new RegExp(
      `^(?:${escapedModule}(?:\\s+|$))+`,
      'i',
    );
    const nameWithoutModulePrefix = name
      .replace(repeatedModulePrefix, '')
      .trim();

    return nameWithoutModulePrefix
      ? `${module} ${nameWithoutModulePrefix}`
      : module;
  }

  private eventDescription(event: CalendarSourceEvent): string | undefined {
    const parts = [event.moduleName, event.activityCode].filter(
      (value): value is string => Boolean(value?.trim()),
    );
    return parts.length
      ? parts.map((part) => part.trim()).join(' - ')
      : undefined;
  }

  private isTeachingActivity(
    activityType: string | null,
  ): activityType is ActivityType {
    return TEACHING_ACTIVITY_TYPES.has(activityType as ActivityType);
  }

  private isValidTimeRange(startTime?: string, endTime?: string): boolean {
    const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    return Boolean(
      startTime &&
      endTime &&
      timePattern.test(startTime) &&
      timePattern.test(endTime) &&
      startTime < endTime,
    );
  }

  private isDomainDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = dateFromDomain(value);
    return !Number.isNaN(date.getTime()) && domainDate(date) === value;
  }

  private weekdayDates(
    start: string,
    end: string,
    day: Lowercase<Weekday>,
  ): string[] {
    const dates: string[] = [];
    for (
      let current = firstWeekdayOnOrAfter(start, day);
      current <= end;
      current = addDays(current, 7)
    ) {
      dates.push(current);
    }
    return dates;
  }

  private humanize(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(' ');
  }
}
