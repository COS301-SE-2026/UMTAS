import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

import { components, paths } from "@/lib/api";

export type EventDto = components["schemas"]["EventDto"];
export type ActivityTypesEvents = EventDto["activityType"];
export type CreateEventBody =
  paths["/events"]["post"]["requestBody"]["content"]["application/json"];
export type EventCriteria = CreateEventBody["eventCriteria"];

export type createEventRes =
  paths["/events"]["post"]["responses"]["201"]["content"]["application/json"];

export type getallEventsReq = paths["/events"]["get"]["parameters"]["query"];
export type getAllEventsRes =
  paths["/events"]["get"]["responses"]["200"]["content"]["application/json"];

export type EventResponse = getAllEventsRes["events"][number];

export type getEventByIDPath =
  paths["/events/{eventId}"]["get"]["parameters"]["path"];
export type getEventByIDRes =
  paths["/events/{eventId}"]["get"]["responses"]["200"]["content"]["application/json"];

export type updateEventByIdPath =
  paths["/events/{id}"]["patch"]["parameters"]["path"];

export type updateEventByIdBody =
  paths["/events/{id}"]["patch"]["requestBody"]["content"]["application/json"];
export type updateEventByIdRes =
  paths["/events/{id}"]["patch"]["responses"]["200"]["content"]["application/json"];

type deleteEventByIdPath =
  paths["/events/{id}"]["delete"]["parameters"]["path"];
export type deleteEventByIdRes =
  paths["/events/{id}"]["delete"]["responses"]["200"]["content"]["application/json"];

export class createEventsBuilder extends RequestBuilder<
  undefined,
  CreateEventBody,
  createEventRes
> {
  constructor() {
    super();
    this.setUrl("/events").setMethod(RequestMethod.POST);
  }
}

export class getAllEventsBuilder extends RequestBuilder<
  getallEventsReq,
  undefined,
  getAllEventsRes
> {
  constructor() {
    super();
    this.setUrl("/events").setMethod(RequestMethod.GET);
  }
}

export class getEventByIDBuilder extends RequestBuilder<
  getEventByIDPath,
  undefined,
  getEventByIDRes
> {
  constructor() {
    super();
    this.setUrl("/events/{id}").setMethod(RequestMethod.GET);
  }
}

export class updateEventByID extends RequestBuilder<
  updateEventByIdPath,
  updateEventByIdBody,
  updateEventByIdRes
> {
  constructor() {
    super();
    this.setUrl("/events/{id}").setMethod(RequestMethod.PATCH);
  }
}

export class deleteEventById extends RequestBuilder<
  deleteEventByIdPath,
  undefined,
  deleteEventByIdRes
> {
  constructor() {
    super();
    this.setUrl("/events/{id}").setMethod(RequestMethod.DELETE);
  }
}
