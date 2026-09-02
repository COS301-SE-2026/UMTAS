import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

import { paths } from "@/lib/api";

export type CreateEventBody =
  paths["/api/events"]["post"]["requestBody"]["content"]["application/json"];
export type EventCriteria = CreateEventBody["eventCriteria"];

export type createEventRes =
  paths["/api/events"]["post"]["responses"]["201"]["content"]["application/json"];

export type getallEventsReq =
  paths["/api/events"]["get"]["parameters"]["query"];
export type getAllEventsRes =
  paths["/api/events"]["get"]["responses"]["200"]["content"]["application/json"];

export type EventResponse = getAllEventsRes["events"][number];

export type getEventByIDPath =
  paths["/api/events/{eventId}"]["get"]["parameters"]["path"];
export type getEventByIDRes =
  paths["/api/events/{eventId}"]["get"]["responses"]["200"]["content"]["application/json"];

export type updateEventByIdPath =
  paths["/api/events/{id}"]["patch"]["parameters"]["path"];

export type updateEventByIdBody =
  paths["/api/events/{id}"]["patch"]["requestBody"]["content"]["application/json"];
export type updateEventByIdRes =
  paths["/api/events/{id}"]["patch"]["responses"]["200"]["content"]["application/json"];

type deleteEventByIdPath =
  paths["/api/events/{id}"]["delete"]["parameters"]["path"];
export type deleteEventByIdRes =
  paths["/api/events/{id}"]["delete"]["responses"]["200"]["content"]["application/json"];

export type updateEventVenuePath =
  paths["/api/events/{id}/venue"]["patch"]["parameters"]["path"];
export type updateEventVenueBody =
  paths["/api/events/{id}/venue"]["patch"]["requestBody"]["content"]["application/json"];
export type updateEventVenueRes =
  paths["/api/events/{id}/venue"]["patch"]["responses"]["200"]["content"]["application/json"];
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

export class updateEventVenueBuilder extends RequestBuilder<
  updateEventVenuePath,
  updateEventVenueBody,
  updateEventVenueRes
> {
  constructor() {
    super();
    this.setUrl("/events/{id}/venue").setMethod(RequestMethod.PATCH);
  }
}
