import { paths } from "@/lib/api";
import { RequestBuilder, RequestMethod } from "../../../../utilities/request";

export type getAllApplications =
  paths["/universities/applications/{universityID}"]["post"];

export type getAllApplicationsPath = getAllApplications["parameters"]["path"];
export type getAllApplicationsRes = getAllApplications["responses"]["200"];
export type getAllApplicationsBody =
  getAllApplications["requestBody"]["content"]["application/json"];

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
