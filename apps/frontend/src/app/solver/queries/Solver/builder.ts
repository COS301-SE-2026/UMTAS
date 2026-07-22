import { paths } from "@/lib/api";
import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

// uses a users enrolled modules
type createJobBody =
  paths["/solver/jobs"]["post"]["requestBody"]["content"]["application/json"];
type createJobRes =
  paths["/solver/jobs"]["post"]["responses"]["202"]["content"]["application/json"];
export class createJobBuilder extends RequestBuilder<
  undefined,
  createJobBody,
  createJobRes
> {
  constructor() {
    super();
    this.setUrl("/solver/jobs").setMethod(RequestMethod.POST);
  }
}

export type enrollToModPath =
  paths["/modules/{moduleId}"]["post"]["parameters"]["path"];

export type enrollToModRes =
  paths["/modules/{moduleId}"]["post"]["responses"]["200"]["content"]["application/json"];
export class enrollModBuilder extends RequestBuilder<
  enrollToModPath,
  undefined,
  enrollToModRes
> {
  constructor() {
    super();
    this.setUrl("/modules/{moduleId}").setMethod(RequestMethod.GET);
  }
}

export type getSolverOutputPath =
  paths["/solver/jobs/{jobId}/result"]["get"]["parameters"]["path"];

export type getSolverOutputRes =
  paths["/solver/jobs/{jobId}/result"]["get"]["responses"]["200"]["content"]["application/json"];

export class getSolverOutputBuilder extends RequestBuilder<
  getSolverOutputPath,
  undefined,
  getSolverOutputRes
> {
  constructor() {
    super();
    this.setUrl("/solver/jobs/{jobId}/result").setMethod(RequestMethod.GET);
  }
}
