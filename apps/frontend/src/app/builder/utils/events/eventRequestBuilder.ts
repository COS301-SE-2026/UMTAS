import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

import { paths } from "@/lib/api";

type createEventBody =
  paths["/events"]["post"]["requestBody"]["content"]["application/json"];
type createEventRes =
  paths["/events"]["post"]["responses"]["201"]["content"]["application/json"];

type getAllEventsRes =
  paths["/events"]["get"]["responses"]["200"]["content"]["application/json"];

type getEventByIDPath = paths["/events/{id}"]["get"]["parameters"]["path"];

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
  undefined
> {
  constructor() {
    super();
    this.setUrl("/events/{id}").setMethod(RequestMethod.GET);
  }
}
