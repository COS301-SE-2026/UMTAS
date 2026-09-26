import { RequestBuilder, RequestMethod } from "../request";
import { paths } from "@/lib/api";

export type getRouteQuery = paths["/api/routes"]["get"]["parameters"]["query"];
export type getRouteRes =
  paths["/api/routes"]["get"]["responses"]["200"]["content"]["application/json"];

export type getActiveRouteQuery =
  paths["/api/routes/active"]["get"]["parameters"]["query"];
export type getActiveRouteRes =
  paths["/api/routes/active"]["get"]["responses"]["200"]["content"]["application/json"];

export type getRoutingHeatmapQuery =
  paths["/api/routes/heatmap"]["get"]["parameters"]["query"];
export type getRoutingHeatmapRes =
  paths["/api/routes/heatmap"]["get"]["responses"]["200"]["content"]["application/json"];
export type RouteHeatmapType = getRoutingHeatmapRes["routes"][number];

export type getStudentRoutesQuery =
  paths["/api/routes/student"]["get"]["parameters"]["query"];
export type getStudentRoutesRes =
  paths["/api/routes/student"]["get"]["responses"]["200"]["content"]["application/json"];

export class getRouterBuilder extends RequestBuilder<
  undefined,
  undefined,
  getRouteRes,
  getRouteQuery
> {
  constructor() {
    super();
    this.setUrl("/routes").setMethod(RequestMethod.GET);
  }
}

export class getActiveRouteBuilder extends RequestBuilder<
  getActiveRouteQuery,
  undefined,
  getActiveRouteRes
> {
  constructor() {
    super();
    this.setUrl("/routes/active").setMethod(RequestMethod.GET);
  }
}

export class getRoutingHeatmapBuilder extends RequestBuilder<
  undefined,
  undefined,
  getRoutingHeatmapRes,
  getRoutingHeatmapQuery
> {
  constructor() {
    super();
    this.setUrl("/routes/heatmap").setMethod(RequestMethod.GET);
  }
}

export class getStudentRoutesBuilder extends RequestBuilder<
  undefined,
  undefined,
  getStudentRoutesRes,
  getStudentRoutesQuery
> {
  constructor() {
    super();
    this.setUrl("/routes/student").setMethod(RequestMethod.GET);
  }
}
