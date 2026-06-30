import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

import { paths, components } from "@/lib/api";

type createModuleReq =
  paths["/builder"]["post"]["requestBody"]["content"]["application/json"];
type createModuleRes =
  paths["/builder"]["post"]["responses"]["201"]["content"]["application/json"];
type deleteModulesByIdRes =
  paths["/builder/{moduleId}"]["delete"]["responses"]["200"]["content"]["application/json"];
type deleteModulesByIdPath =
  paths["/builder/{moduleId}"]["delete"]["parameters"]["path"];
type getAllModulesRes =
  paths["/builder"]["get"]["responses"]["200"]["content"]["application/json"];
type getModuleByIdReq =
  paths["/builder/{moduleId}"]["get"]["parameters"]["path"];
type getModuleByIdRes =
  paths["/builder/{moduleId}"]["get"]["responses"]["200"]["content"]["application/json"];
type updateModuleByIdBody =
  paths["/builder/{moduleId}"]["patch"]["requestBody"]["content"]["application/json"];

type updateModuleByIdPath =
  paths["/builder/{moduleId}"]["patch"]["parameters"]["path"];

type updateModuleByIdRes =
  paths["/builder/{moduleId}"]["patch"]["responses"]["200"]["content"]["application/json"];

export type ModuleResponseDto =
  components["schemas"]["ModuleSingleResponseDto"];

export class createModulesBuilder extends RequestBuilder<
  undefined,
  createModuleReq,
  createModuleRes
> {
  constructor() {
    super();
    this.setUrl("/builder").setMethod(RequestMethod.POST);
  }
}

export class getAllModulesBuilder extends RequestBuilder<
  undefined,
  undefined,
  getAllModulesRes
> {
  constructor() {
    super();
    this.setUrl("/builder").setMethod(RequestMethod.GET);
  }
}

export class getModulesByIdBuilder extends RequestBuilder<
  getModuleByIdReq,
  undefined,
  getModuleByIdRes
> {
  constructor() {
    super();
    this.setUrl("/builder/{moduleId}").setMethod(RequestMethod.GET);
  }
}

export class updateModulesBuilder extends RequestBuilder<
  updateModuleByIdPath,
  updateModuleByIdBody,
  updateModuleByIdRes
> {
  constructor() {
    super();
    this.setUrl("/builder/{moduleId}").setMethod(RequestMethod.PATCH);
  }
}

export class deleteModulesById extends RequestBuilder<
  deleteModulesByIdPath,
  undefined,
  deleteModulesByIdRes
> {
  constructor() {
    super();
    this.setUrl("/builder/{moduleId}").setMethod(RequestMethod.DELETE);
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
