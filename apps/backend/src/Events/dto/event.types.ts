
export enum EventType {
    UNIVERSITY = 'university',
    PERSONAL = 'personal'
}//EventType

export interface EventCriteria {

    type: EventType,
    day: string,
    startTime: string,
    endTime: string
}//EventCriteria

export interface UniversityEventCriteria extends EventCriteria {
    type: EventType.UNIVERSITY;
}//LectureEventCriteria

export interface PersonalEventCriteria extends EventCriteria {
    type: EventType.PERSONAL;
}