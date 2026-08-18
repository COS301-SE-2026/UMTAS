import { RequestBuilder, RequestMethod } from "../request";
import { paths } from "@/lib/api";

export type getAllBuildingsPath =
  paths["/api/buildings"]["get"]["parameters"]["path"];
export type getAllBuildingsRes =
  paths["/api/buildings"]["get"]["responses"]["200"]["content"]["application/json"];

export type createBuildingBody =
  paths["/api/buildings"]["post"]["requestBody"]["content"]["application/json"];
export type createBuildingPath =
  paths["/api/buildings"]["post"]["parameters"]["path"];
export type createBuildingRes =
  paths["/api/buildings"]["post"]["responses"]["201"]["content"]["application/json"];

export class getAllBuildingsBuilder extends RequestBuilder<
  getAllBuildingsPath,
  undefined,
  getAllBuildingsRes
> {
  constructor() {
    super();
    this.setUrl("/buildings").setMethod(RequestMethod.GET);
  }
}

export class createBuildingBuilder extends RequestBuilder<
  createBuildingPath,
  createBuildingBody,
  createBuildingRes
> {
  constructor() {
    super();
    this.setUrl("/buildings").setMethod(RequestMethod.POST);
  }
}
