import { RequestBuilder, RequestMethod } from "../request";
import { paths } from "@/lib/api";

export type getRouteQuery = paths["/api/routes"]["get"]["parameters"]["query"];
export type getRouteRes =
  paths["/api/routes"]["get"]["responses"]["200"]["content"]["application/json"];

export type getActiveRouteQuery =
  paths["/api/routes/active"]["get"]["parameters"]["query"];
export type getActiveRouteRes =
  paths["/api/routes/active"]["get"]["responses"]["200"]["content"]["application/json"];

export class getRouterBuilder extends RequestBuilder<
  getRouteQuery,
  undefined,
  getRouteRes
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
