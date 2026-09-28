import { paths } from "@/lib/api";
import { RequestBuilder, RequestMethod } from "../request";

export type getAllVisionSessionsQuery =
  paths["/api/vision-sessions"]["get"]["parameters"]["query"];
export type getAllVisionSessionsRes =
  paths["/api/vision-sessions"]["get"]["responses"]["200"]["content"]["application/json"];

export type getAllEventsQuery =
  paths["/api/events"]["get"]["parameters"]["query"];
export type getAllEventsRes =
  paths["/api/events"]["get"]["responses"]["200"]["content"]["application/json"];

export class getAllVisionSessionsBuilder extends RequestBuilder<
  undefined,
  undefined,
  getAllVisionSessionsRes,
  getAllVisionSessionsQuery
> {
  constructor() {
    super();
    this.setUrl("/vision-sessions").setMethod(RequestMethod.GET);
  }
}

export class getAllEventsBuilder extends RequestBuilder<
  undefined,
  undefined,
  getAllEventsRes,
  getAllEventsQuery
> {
  constructor() {
    super();
    this.setUrl("/events").setMethod(RequestMethod.GET);
  }
}
