import { components, paths } from "@/lib/api";
import { RequestBuilder, RequestMethod } from "../../../../utilities/request";

export type getAllApplications =
  paths["/universities/applications/{universityID}"]["post"];

export type getAllApplicationsPath = getAllApplications["parameters"]["path"];
export type getAllApplicationsRes =
  getAllApplications["responses"]["200"]["content"]["application/json"];
export type getAllApplicationsBody =
  getAllApplications["requestBody"]["content"]["application/json"];

export type getSingleApplication = components["schemas"]["GetRolesDto"];
export type rolesTypeType = components["schemas"]["GetRolesDto"]["role"];
export const arrRolesAll: NonNullable<rolesTypeType>[] = [
  "LECTURER",
  "LECTURER_PENDING",
  "REJECTED",
  "STUDENT",
  "SYSTEM_ADMIN",
  "UNIVERSITY_ADMIN_PENDING",
  "UNIVERSITY_ADMIN",
];
export const arrRolesValid: NonNullable<rolesTypeType>[] = [
  "LECTURER",
  "REJECTED",
  "STUDENT",
  "SYSTEM_ADMIN",
  "UNIVERSITY_ADMIN",
];
export class getAllApplicationsBuilder extends RequestBuilder<
  getAllApplicationsPath,
  getAllApplicationsBody,
  getAllApplicationsRes
> {
  constructor() {
    super();
    this.setUrl("/universities/applications/{universityID}").setMethod(
      RequestMethod.POST,
    );
  }
}

export type approveApplications = paths["/universities/approve"]["post"];
export type approveApplicationsBody =
  approveApplications["requestBody"]["content"]["application/json"];
export type approveApplicationsRes =
  approveApplications["responses"]["201"]["content"]["application/json"];

export class approveBuilder extends RequestBuilder<
  undefined,
  approveApplicationsBody,
  approveApplicationsRes
> {
  constructor() {
    super();
    this.setUrl("/universities/approve").setMethod(RequestMethod.POST);
  }
}
