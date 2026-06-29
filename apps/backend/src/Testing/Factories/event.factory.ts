import { randomUUID } from "crypto";
import { Event } from "src/entities";
import { EventType } from "src/Events/dto/event.types";

type Event= typeof Event.$inferSelect;

export function createEvent(
    overrides: Partial<Event>={}
): Event{

    return{
        eventID: randomUUID(),
        eventName: 'Lecture 1',
        eventCode: 'Lec1',
        eventCriteria: {
            type: EventType.UNIVERSITY,
            date: 'yyyy-mm-dd',
            startTime: '08:30',
            endTime: '10:20',
            moduleID: randomUUID(),
            venue: 'IT 2-26'
        },
        isRecurring: true,

        ...overrides
    };
}//END_createEvent