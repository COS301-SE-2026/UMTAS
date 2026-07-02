import { randomUUID } from 'crypto';
import {
  Event,
  UniversityEvent,
  PersonalEvent,
  Venue,
  EventVenue,
} from '../../entities/index';
import { EventCriteria, EventType } from '../../Events/dto/event.types';
import { CreateEventDto } from '../../Events/dto/EventDto.dto';

export function createEventCriteria(
  type: EventType = EventType.UNIVERSITY,
  overrides: Partial<EventCriteria> = {},
): EventCriteria {
  const base: EventCriteria = {
    type,
    date: 'yyyy-mm-dd',
    startTime: '08:30',
    endTime: '10:20',

    ...(type === EventType.UNIVERSITY && {
      moduleID: randomUUID(),
      venue: 'IT 2-26',
    }),
  };

  return { ...base, ...overrides };
} //END_createEventCriteria

type EventEntity = typeof Event.$inferSelect;
export function createEvent(
  type: EventType = EventType.UNIVERSITY,
  overrides: Partial<EventEntity> = {},
  eventCriteriaOverrides: Partial<EventCriteria> = {},
): EventEntity {
  const base: EventEntity = {
    eventID: randomUUID(),
    eventName: 'Lecture 1',
    eventCode: 'Lec1',
    isRecurring: false,
    eventCriteria: createEventCriteria(type, eventCriteriaOverrides),
  };

  return {
    ...base,
    ...overrides,
  };
} //END_createEvent

export function createCreateEventDto(event: EventEntity): CreateEventDto {
  const { ...dto } = event;
  return dto;
} ///END_createCreateEventDto

type UniversityEvent = typeof UniversityEvent.$inferSelect;
export function createUniversityEvent(
  overrides: Partial<UniversityEvent> = {},
): UniversityEvent {
  return {
    UniversityEventID: randomUUID(),
    moduleID: randomUUID(),
    eventID: randomUUID(),
    VenueID: randomUUID(),

    ...overrides,
  };
} //END_createUniversityEvent

type PersonalEvent = typeof PersonalEvent.$inferSelect;
export function createPersonalEvent(
  overrides: Partial<PersonalEvent> = {},
): PersonalEvent {
  return {
    PersonalEventID: randomUUID(),
    UserID: randomUUID(),
    eventID: randomUUID(),

    ...overrides,
  };
} //END_createPersonalEvent

type Venue = typeof Venue.$inferSelect;
export function createVenue(overrides: Partial<Venue> = {}): Venue {
  return {
    VenueID: randomUUID(),
    VenueName: 'venueNaampie',
    UniversityID: randomUUID(),

    ...overrides,
  };
} //END_createVenue

type EventVenue = typeof EventVenue.$inferSelect;
export function createEventVenue(
  overrides: Partial<EventVenue> = {},
): EventVenue {
  return {
    VenueID: randomUUID(),
    EventID: randomUUID(),

    ...overrides,
  };
} //END_EventVenue
