
export enum EventType {
    UNIVERSITY = 'university',
    PERSONAL = 'personal'
}//EventType

export interface EventCriteria {

    type: EventType,
    date: string,
    startTime: string,
    endTime: string,
    venue?: string,
    moduleID?: string
}//EventCriteria

export interface UniversityEventCriteria extends EventCriteria {
    type: EventType.UNIVERSITY;
}//LectureEventCriteria

export interface PersonalEventCriteria extends EventCriteria {
    type: EventType.PERSONAL;
}