import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

import { paths, components } from "@/lib/api";

type createModuleReq =
  paths["/modules"]["post"]["requestBody"]["content"]["application/json"];
type createModuleRes =
  paths["/modules"]["post"]["responses"]["201"]["content"]["application/json"];
type deleteModulesByIdRes =
  paths["/modules/{moduleId}"]["delete"]["responses"]["200"]["content"]["application/json"];
type deleteModulesByIdPath =
  paths["/modules/{moduleId}"]["delete"]["parameters"]["path"];
type getAllModulesRes =
  paths["/modules"]["get"]["responses"]["200"]["content"]["application/json"];
type getModuleByIdReq =
  paths["/modules/{moduleId}"]["get"]["parameters"]["path"];
type getModuleByIdRes =
  paths["/modules/{moduleId}"]["get"]["responses"]["200"]["content"]["application/json"];
type updateModuleByIdBody =
  paths["/modules/{moduleId}"]["patch"]["requestBody"]["content"]["application/json"];

type updateModuleByIdPath =
  paths["/modules/{moduleId}"]["patch"]["parameters"]["path"];

type updateModuleByIdRes =
  paths["/modules/{moduleId}"]["patch"]["responses"]["200"]["content"]["application/json"];

export type ModuleResponseDto = components["schemas"]["ModuleResponseDto"];

export class createModulesBuilder extends RequestBuilder<
  undefined,
  createModuleReq,
  createModuleRes
> {
  constructor() {
    super();
    this.setUrl("/modules").setMethod(RequestMethod.POST);
  }
}

export class getAllModulesBuilder extends RequestBuilder<
  undefined,
  undefined,
  getAllModulesRes
> {
  constructor() {
    super();
    this.setUrl("/modules").setMethod(RequestMethod.GET);
  }
}

export class getModulesByIdBuilder extends RequestBuilder<
  getModuleByIdReq,
  undefined,
  getModuleByIdRes
> {
  constructor() {
    super();
    this.setUrl("/modules/{moduleId}").setMethod(RequestMethod.GET);
  }
}

export class updateModulesBuilder extends RequestBuilder<
  updateModuleByIdPath,
  updateModuleByIdBody,
  updateModuleByIdRes
> {
  constructor() {
    super();
    this.setUrl("/modules/{moduleId}").setMethod(RequestMethod.PATCH);
  }
}

export class deleteModulesById extends RequestBuilder<
  deleteModulesByIdPath,
  undefined,
  deleteModulesByIdRes
> {
  constructor() {
    super();
    this.setUrl("/modules/{moduleId}").setMethod(RequestMethod.DELETE);
  }
}

export type {
  createModuleReq,
  createModuleRes,
  getAllModulesRes,
  getModuleByIdReq,
  getModuleByIdRes,
  updateModuleByIdBody,
  updateModuleByIdPath,
  updateModuleByIdRes,
  deleteModulesByIdRes,
  deleteModulesByIdPath,
};
