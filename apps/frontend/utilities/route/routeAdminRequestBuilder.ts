import { RequestBuilder, RequestMethod } from "../request";
import { paths } from "@/lib/api";

export type divertRouteBody =
  paths["/api/routes/diversion"]["put"]["requestBody"]["content"]["application/json"];
export type divertRouteRes =
  paths["/api/routes/diversion"]["put"]["responses"]["200"]["content"]["application/json"];

export type getRouteVariantQuery =
  paths["/api/routes/variant"]["get"]["parameters"]["query"];
export type getRouteVariantRes =
  paths["/api/routes/variant"]["get"]["responses"]["200"]["content"]["application/json"];

export class diverRouteBuilder extends RequestBuilder<
  undefined,
  divertRouteBody,
  divertRouteRes
> {
  constructor() {
    super();
    this.setUrl("/routes/diversion").setMethod(RequestMethod.PUT);
  }
}

export class getRouteVariantBuilder extends RequestBuilder<
  undefined,
  undefined,
  getRouteVariantRes,
  getRouteVariantQuery
> {
  constructor() {
    super();
    this.setUrl("/routes/variant").setMethod(RequestMethod.GET);
  }
}
