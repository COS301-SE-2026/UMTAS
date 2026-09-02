import { RequestBuilder, RequestMethod } from "../request";
import { paths } from "@/lib/api";

export type getMapConfigPath =
  paths["/api/map-config"]["get"]["parameters"]["path"];
export type getMapConfigRes =
  paths["/api/map-config"]["get"]["responses"]["200"]["content"]["application/json"];

export type updateMapConfigBody =
  paths["/api/map-config"]["put"]["requestBody"]["content"]["application/json"];
export type updateMapConfigPath =
  paths["/api/map-config"]["put"]["parameters"]["path"];
export type updateMapConfigRes =
  paths["/api/map-config"]["put"]["responses"]["200"]["content"]["application/json"];

export class getMapConfigBuilder extends RequestBuilder<
  getMapConfigPath,
  undefined,
  getMapConfigRes
> {
  constructor() {
    super();
    this.setUrl("/map-config").setMethod(RequestMethod.GET);
  }
}

export class updateMapConfigBuilder extends RequestBuilder<
  updateMapConfigPath,
  updateMapConfigBody,
  updateMapConfigRes
> {
  constructor() {
    super();
    this.setUrl("/map-config").setMethod(RequestMethod.PUT);
  }
}
