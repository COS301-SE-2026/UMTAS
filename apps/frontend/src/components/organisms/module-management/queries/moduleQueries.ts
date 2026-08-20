import { paths } from "@/lib/api";
import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";
import { mutationOptions } from "@tanstack/react-query";

export type updateEnrollment = paths["/api/modules/enroll/{moduleId}"]["patch"];

export type updateEnrollmentParam = updateEnrollment["parameters"]["path"];
export type updateEnrollmentBody =
  updateEnrollment["requestBody"]["content"]["application/json"];

export type updateEnrollmentResp =
  updateEnrollment["responses"]["200"]["content"]["application/json"];

export class updateEnrollmentBuilder extends RequestBuilder<
  updateEnrollmentParam,
  updateEnrollmentBody,
  updateEnrollmentResp
> {
  constructor() {
    super();
    this.setUrl("/modules/enroll/{moduleId}").setMethod(RequestMethod.PATCH);
  }
}
