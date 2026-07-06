import { components, paths } from "@/lib/api";
import {
  RequestMethod,
  RequestBuilder,
} from "../../../../../utilities/request";

export type uniDto = components["schemas"]["UniversityDto"];
export type uniDtoRoles = components["schemas"]["UniversityDto"]["role"];
export type getallUnis =
  paths["/universities"]["get"]["responses"]["200"]["content"]["application/json"];

export class getallUnisBuilder extends RequestBuilder<
  undefined,
  undefined,
  getallUnis
> {
  constructor() {
    super();
    this.setUrl("/universities").setMethod(RequestMethod.GET);
  }
}

export type applyRes =
  paths["/universities/apply"]["post"]["responses"]["201"]["content"]["application/json"];
export type applyBody =
  paths["/universities/apply"]["post"]["requestBody"]["content"]["application/json"];

export class applyUniBuilder extends RequestBuilder<
  undefined,
  applyBody,
  applyRes
> {
  constructor() {
    super();
    this.setUrl("/universities/apply").setMethod(RequestMethod.POST);
  }
}
