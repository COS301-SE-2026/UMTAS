import { RequestBuilder, RequestMethod } from "../request";
import { paths } from "@/lib/api";

export type getRouteQuery = paths["/api/routes"]["get"]["parameters"]["query"];
export type getRouteRes =
  paths["/api/routes"]["get"]["responses"]["200"]["content"]["application/json"];

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
