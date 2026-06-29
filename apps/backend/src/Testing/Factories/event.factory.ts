import { randomUUID } from "crypto";
import { Event, UniversityEvent, PersonalEvent, Venue, EventVenue } from "../../entities/index";
import { EventType } from "../../Events/dto/event.types";
import { CreateEventDto, EventDto } from "../../Events/dto/EventDto.dto";

// const createEventDto: CreateEventDto = {

//     eventName: 'baseEvent_name',
//     eventCode: 'b1',
//     eventCriteria: {
//         type: EventType.UNIVERSITY,
//         date: 'yyyy-mm-dd',
//         startTime: '08:30',
//         endTime: '10:20'
//     },
//     isRecurring: true
// }

type Event= typeof Event.$inferSelect;

export function createEvent(
    overrides: Partial<Event>={}
): Event{

    return{
        eventID: randomUUID(),
        eventName: 'Lecture 1',
        eventCode: 'Lec1',
        isRecurring: true,
        eventCriteria: {
            type: EventType.UNIVERSITY,
            date: 'yyyy-mm-dd',
            startTime: '08:30',
            endTime: '10:20'
        },

        ...overrides
    };
}//END_createEvent

//event with moduleId
export function createEventForModule(
  moduleId: string,
  overrides: Partial<Event> = {}
): Event {
  return createEvent({
    ...overrides,
    eventCriteria: {
      type: EventType.UNIVERSITY,
      date: '2026-06-28',
      startTime: '08:30',
      endTime: '10:20',
      venue: 'IT 2-26',
      moduleID: moduleId,
      ...overrides.eventCriteria
    }
  });
}

type UniversityEvent = typeof UniversityEvent.$inferSelect;
export function createUniversityEvent(
    overrides: Partial<UniversityEvent>={}
): UniversityEvent{

    return{
        UniversityEventID: randomUUID(),
        moduleID: randomUUID(),
        eventID: randomUUID(),
        VenueID: randomUUID(),

        ...overrides
    };
}//END_createUniversityEvent


type PersonalEvent = typeof PersonalEvent.$inferSelect;
export function createPersonalEvent(
    overrides: Partial<PersonalEvent>={}
): PersonalEvent{

    return {
        PersonalEventID: randomUUID(),
        UserID: randomUUID(),
        eventID: randomUUID(),

        ...overrides
    };
}//END_createPersonalEvent

type Venue = typeof Venue.$inferSelect;
export function createVenue(
    overrides: Partial<Venue>={}
): Venue{

    return {
        VenueID: randomUUID(),
        VenueName: 'venueNaampie',
        UniversityID: randomUUID(),

        ...overrides
    };
}//END_createVenue

type EventVenue = typeof EventVenue.$inferSelect;
export function createEventVenue(
    overrides: Partial<EventVenue>={}
): EventVenue{

    return {
        VenueID: randomUUID(),
        EventID: randomUUID(),

        ...overrides
    };
}//END_EventVenue