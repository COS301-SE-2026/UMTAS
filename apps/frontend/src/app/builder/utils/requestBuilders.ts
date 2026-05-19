import { RequestBuilder, RequestMethod } from "../../../../utilities/request";
import { paths } from "@/lib/api";
type createModuleReq =
  paths["/modules"]["post"]["requestBody"]["content"]["application/json"];
type createModuleRes =
  paths["/modules"]["post"]["responses"]["201"]["content"]["application/json"]["module"];

type getAllModules = paths["/modules"]["get"]["requestBody"];

export class createModulesBuilder extends RequestBuilder<
  createModuleReq,
  createModuleRes
> {
  constructor() {
    super();
    this.setUrl("/modules").setMethod(RequestMethod.POST);
  }
}
