import { components, paths } from "@/lib/api";
import {
  createUrl,
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

export type moduleDTO = components["schemas"]["ModuleSingleResponseDto"];
export type getAllModules = paths["/api/modules"]["get"];

export type getAllModulesQueries = getAllModules["parameters"]["query"];
export type getAllModulesRes =
  getAllModules["responses"]["200"]["content"]["application/json"]["modules"];

type updateModule = paths["/api/modules/{moduleId}"]["patch"];
export type updateModulePath = updateModule["parameters"]["path"];
export type updateModuleBody =
  updateModule["requestBody"]["content"]["application/json"];
export type updateModuleRes =
  updateModule["responses"]["200"]["content"]["application/json"];

export class updateModuleBuilder extends RequestBuilder<
  updateModulePath,
  updateModuleBody,
  updateModuleRes
> {
  constructor() {
    super();
    this.setUrl("/modules/{moduleId}").setMethod(RequestMethod.PATCH);
  }
}

type updateModStyling = paths["/api/modules/styling/{moduleId}"]["post"];
export type updateModStylingPath = updateModStyling["parameters"]["path"];
export type updateModStylingBody =
  updateModStyling["requestBody"]["content"]["application/json"];
export type updateModStylingRes =
  updateModStyling["responses"]["200"]["content"]["application/json"];
export type modStylingDTO = components["schemas"]["StylingDto"];

export class updateStylingBuilder extends RequestBuilder<
  updateModStylingPath,
  updateModStylingBody,
  updateModStylingRes
> {
  constructor() {
    super();
    this.setUrl("/modules/styling/{moduleId}").setMethod(RequestMethod.POST);
  }
}

type createModule = paths["/api/modules"]["post"];

export type CreateModuleBody =
  createModule["requestBody"]["content"]["application/json"];

export type CreateModuleRes =
  createModule["responses"]["201"]["content"]["application/json"];

export class CreateModuleBuilderAdmin extends RequestBuilder<
  undefined,
  CreateModuleBody,
  CreateModuleRes
> {
  constructor() {
    super();
    this.setUrl("/modules").setMethod(RequestMethod.POST);
  }
}
