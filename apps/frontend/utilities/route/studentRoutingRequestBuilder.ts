import { RequestBuilder, RequestMethod } from "../request";
import { paths } from "@/lib/api";

export type getStudentRoutesQuery =
  paths["/api/routes/student"]["get"]["parameters"]["query"];
export type getStudentRoutesRes =
  paths["/api/routes/student"]["get"]["responses"]["200"]["content"]["application/json"];
export type getStudentRouteTransitionType =
  getStudentRoutesRes["routes"][number];

export type getAlternateRoutesQuery =
  paths["/api/routes/student/alternatives"]["get"]["parameters"]["query"];
export type getAlternateRoutesRes =
  paths["/api/routes/student/alternatives"]["get"]["responses"]["200"]["content"]["application/json"];

export class getStudentRoutesBuilder extends RequestBuilder<
  undefined,
  undefined,
  getStudentRoutesRes,
  getStudentRoutesQuery
> {
  constructor() {
    super();
    this.setUrl("/routes/student").setMethod(RequestMethod.GET);
  }
}

export class getAlternateRoutesBuilder extends RequestBuilder<
  undefined,
  undefined,
  getAlternateRoutesRes,
  getAlternateRoutesQuery
> {
  constructor() {
    super();
    this.setUrl("/routes/student/alternatives").setMethod(RequestMethod.GET);
  }
}
