import type { ActivityType } from 'shared-types';

export enum EventSource {
  UNIVERSITY = 'university',
  PERSONAL = 'personal',
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface EventCriteria {
  eventSource: EventSource;
  date?: string;
  dayOfWeek?: DayOfWeek;
  startTime: string;
  endTime: string;
  moduleId?: string;
}

export interface UniversityEventCriteria extends EventCriteria {
  eventSource: EventSource.UNIVERSITY;
  moduleId: string;
  activityType: ActivityType;
  activityRequirements?: Record<string, { requiredSelections: number }>;
}

export interface PersonalEventCriteria extends EventCriteria {
  eventSource: EventSource.PERSONAL;
}
