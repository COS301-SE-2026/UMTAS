import { paths } from "@/lib/api";
import { RequestBuilder, RequestMethod } from "../request";

export type getUniversityStatsRes =
  paths["/api/universities/statistics"]["get"]["responses"]["200"]["content"]["application/json"];
export type getCourseStatsRes =
  paths["/api/Courses/statistics"]["get"]["responses"]["200"]["content"]["application/json"];
export type getModuleStatsRes =
  paths["/api/modules/statistics"]["get"]["responses"]["200"]["content"]["application/json"];
export type getEventStatsWeekRes =
  paths["/api/events/statistics/week"]["get"]["responses"]["200"]["content"]["application/json"];
export type getEventStatsVenueRes =
  paths["/api/events/statistics/venue"]["get"]["responses"]["200"]["content"]["application/json"];

export class getUniversityStatsBuilder extends RequestBuilder<
  undefined,
  undefined,
  getUniversityStatsRes
> {
  constructor() {
    super();
    this.setUrl("/universities/statistics").setMethod(RequestMethod.GET);
  }
}

export class getCourseStatsBuilder extends RequestBuilder<
  undefined,
  undefined,
  getCourseStatsRes
> {
  constructor() {
    super();
    this.setUrl("/Courses/statistics").setMethod(RequestMethod.GET);
  }
}

export class getModuleStatsBuilder extends RequestBuilder<
  undefined,
  undefined,
  getModuleStatsRes
> {
  constructor() {
    super();
    this.setUrl("/modules/statistics").setMethod(RequestMethod.GET);
  }
}

export class getEventStatsWeekBuilder extends RequestBuilder<
  undefined,
  undefined,
  getEventStatsWeekRes
> {
  constructor() {
    super();
    this.setUrl("/events/statistics/week").setMethod(RequestMethod.GET);
  }
}

export class getEventStatsVenueBuilder extends RequestBuilder<
  undefined,
  undefined,
  getEventStatsVenueRes
> {
  constructor() {
    super();
    this.setUrl("/events/statistics/venue").setMethod(RequestMethod.GET);
  }
}
