import { RequestBuilder, RequestMethod } from "../../../../utilities/request";
import { paths } from "@/lib/api";
type createModuleReq =
  paths["/modules"]["post"]["requestBody"]["content"]["application/json"];
type createModuleRes =
  paths["/modules"]["post"]["responses"]["201"]["content"]["application/json"]["module"];

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

type getAllModulesRes =
  paths["/modules"]["get"]["responses"]["200"]["content"]["application/json"]["modules"];

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

type getModuleByIdReq =
  paths["/modules/{moduleId}"]["get"]["parameters"]["path"];
type getModuleByIdRes =
  paths["/modules/{moduleId}"]["get"]["responses"]["200"]["content"]["application/json"]["module"];

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

type updateModuleByIdBody =
  paths["/modules/{moduleId}"]["patch"]["requestBody"]["content"]["application/json"];

type updateModuleByIdPath =
  paths["/modules/{moduleId}"]["patch"]["parameters"]["path"];

type updateModuleByIdRes =
  paths["/modules/{moduleId}"]["patch"]["responses"]["200"]["content"]["application/json"]["module"];

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

type deleteModulesByIdRes =
  paths["/modules/{moduleId}"]["delete"]["responses"]["200"]["content"]["application/json"];

export class deleteModulesById extends RequestBuilder<
  undefined,
  undefined,
  deleteModulesById
> {
  constructor() {
    super();
    this.setUrl("/modules/{moduleId}").setMethod(RequestMethod.DELETE);
  }
}
