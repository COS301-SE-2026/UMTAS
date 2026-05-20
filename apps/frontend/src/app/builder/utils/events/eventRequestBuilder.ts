import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

import { paths } from "@/lib/api";

type createEventBody =
  paths["/events"]["post"]["requestBody"]["content"]["application/json"];
export type createEventRes =
  paths["/events"]["post"]["responses"]["201"]["content"]["application/json"];

export type getAllEventsRes =
  paths["/events"]["get"]["responses"]["200"]["content"]["application/json"];

export type EventResponse = getAllEventsRes["events"][number];

type getEventByIDPath = paths["/events/{id}"]["get"]["parameters"]["path"];
export type getEventByIDRes =
  paths["/events/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

type updateEventByIdPath = paths["/events/{id}"]["patch"]["parameters"]["path"];
type updateEventByIdBody =
  paths["/events/{id}"]["patch"]["requestBody"]["content"]["application/json"];
export type updateEventByIdRes =
  paths["/events/{id}"]["patch"]["responses"]["200"]["content"]["application/json"];

type deleteEventByIdPath =
  paths["/events/{id}"]["delete"]["parameters"]["path"];
export type deleteEventByIdRes =
  paths["/events/{id}"]["delete"]["responses"]["200"]["content"]["application/json"];

export class createEventsBuilder extends RequestBuilder<
  undefined,
  createEventBody,
  createEventRes
> {
  constructor() {
    super();
    this.setUrl("/events").setMethod(RequestMethod.POST);
  }
}

export class getAllEventsBuilder extends RequestBuilder<
  undefined,
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
