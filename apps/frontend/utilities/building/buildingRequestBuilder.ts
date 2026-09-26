import { RequestBuilder, RequestMethod } from "../request";
import { paths } from "@/lib/api";

export type getAllBuildingsPath =
  paths["/api/buildings"]["get"]["parameters"]["path"];
export type getAllBuildingsRes =
  paths["/api/buildings"]["get"]["responses"]["200"]["content"]["application/json"];
export type getAllBuildingsQuery =
  paths["/api/buildings"]["get"]["parameters"]["query"];
export type BuildingType = getAllBuildingsRes["buildings"][number];

export type createBuildingBody =
  paths["/api/buildings"]["post"]["requestBody"]["content"]["application/json"];
export type createBuildingPath =
  paths["/api/buildings"]["post"]["parameters"]["path"];
export type createBuildingRes =
  paths["/api/buildings"]["post"]["responses"]["201"]["content"]["application/json"];

export type updateBuildingLocationBody =
  paths["/api/buildings/{buildingId}"]["patch"]["requestBody"]["content"]["application/json"];
export type updateBuildingLocationPath =
  paths["/api/buildings/{buildingId}"]["patch"]["parameters"]["path"];
export type updateBuildingLocationRes =
  paths["/api/buildings/{buildingId}"]["patch"]["responses"]["200"]["content"]["application/json"];

export type getBuildingHeatmapPath =
  paths["/api/buildings/{buildingId}/heatmap"]["get"]["parameters"]["path"];
export type getBuildingHeatmapQuery =
  paths["/api/buildings/{buildingId}/heatmap"]["get"]["parameters"]["query"];
export type getBuildingHeatmapRes =
  paths["/api/buildings/{buildingId}/heatmap"]["get"]["responses"]["200"]["content"]["application/json"];

export type getAllBuildingsHeatmapQuery =
  paths["/api/buildings/heatmap"]["get"]["parameters"]["query"];
export type getAllBuildingsHeatmapRes =
  paths["/api/buildings/heatmap"]["get"]["responses"]["200"]["content"]["application/json"];
export type BuildingHeatmapType =
  getAllBuildingsHeatmapRes["buildings"][number];

export type getBuildingByIDPath =
  paths["/api/buildings/{buildingId}"]["get"]["parameters"]["path"];
export type getBuildingByIDRes =
  paths["/api/buildings/{buildingId}"]["get"]["responses"]["200"]["content"]["application/json"];

export type deleteBuildingPath =
  paths["/api/buildings/{buildingId}"]["delete"]["parameters"]["path"];
export type deleteBuildingRes =
  paths["/api/buildings/{buildingId}"]["delete"]["responses"]["200"]["content"]["application/json"];

export class getAllBuildingsBuilder extends RequestBuilder<
  getAllBuildingsQuery,
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

export class updateBuildingLocationBuilder extends RequestBuilder<
  updateBuildingLocationPath,
  updateBuildingLocationBody,
  updateBuildingLocationRes
> {
  constructor() {
    super();
    this.setUrl("/buildings/{buildingId}").setMethod(RequestMethod.PATCH);
  }
}

export class getBuildingHeatmapBuilder extends RequestBuilder<
  getBuildingHeatmapPath,
  undefined,
  getBuildingHeatmapRes,
  getBuildingHeatmapQuery
> {
  constructor() {
    super();
    this.setUrl("/buildings/{buildingId}/heatmap").setMethod(RequestMethod.GET);
  }
}

export class getAllBuildingsHeatmapBuilder extends RequestBuilder<
  undefined,
  undefined,
  getAllBuildingsHeatmapRes,
  getAllBuildingsHeatmapQuery
> {
  constructor() {
    super();
    this.setUrl("/buildings/heatmap").setMethod(RequestMethod.GET);
  }
}

export class getBuildingByIdBuilder extends RequestBuilder<
  getBuildingByIDPath,
  undefined,
  getBuildingByIDRes
> {
  constructor() {
    super();
    this.setUrl("/buildings/{buildingId}").setMethod(RequestMethod.GET);
  }
}

export class deleteBuildingBuilder extends RequestBuilder<
  deleteBuildingPath,
  undefined,
  deleteBuildingRes
> {
  constructor() {
    super();
    this.setUrl("/buildings/{buildingId}").setMethod(RequestMethod.DELETE);
  }
}
