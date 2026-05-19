import { RequestBuilder, RequestMethod } from "../../../../utilities/request";
import { paths } from "@/lib/api";
type createModuleReq =
  paths["/modules"]["post"]["requestBody"]["content"]["application/json"];
type createModuleRes =
  paths["/modules"]["post"]["responses"]["201"]["content"]["application/json"]["module"];
type getAllModulesRes =
  paths["/modules"]["get"]["responses"]["200"]["content"]["application/json"]["modules"];
type getModuleByIdReq =
  paths["/modules/{moduleId}"]["get"]["parameters"]["path"];
type getModuleByIdRes =
  paths["/modules/{moduleId}"]["get"]["responses"]["200"]["content"]["application/json"]["module"];

export class createModulesBuilder extends RequestBuilder<
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
  getAllModulesRes
> {
  constructor() {
    super();
    this.setUrl("/modules").setMethod(RequestMethod.GET);
  }
}

export class getModulesByIdBuilder extends RequestBuilder<
  getModuleByIdReq,
  getModuleByIdRes
> {
  constructor() {
    super();
    this.setUrl("/modules/{moduleId}").setMethod(RequestMethod.GET);
  }
}
