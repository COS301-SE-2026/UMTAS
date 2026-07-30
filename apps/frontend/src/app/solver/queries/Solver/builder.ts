import { paths } from "@/lib/api";
import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

// uses a users enrolled modules
type createJobBody =
  paths["/api/solver/jobs"]["post"]["requestBody"]["content"]["application/json"];
type createJobRes =
  paths["/api/solver/jobs"]["post"]["responses"]["202"]["content"]["application/json"];
export class createSolverJobBuilder extends RequestBuilder<
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
  paths["/api/modules/enroll/{moduleId}"]["get"]["parameters"]["path"];

export type enrollToModRes =
  paths["/api/modules/enroll/{moduleId}"]["get"]["responses"]["200"]["content"]["application/json"];
export class enrollModBuilder extends RequestBuilder<
  enrollToModPath,
  undefined,
  enrollToModRes
> {
  constructor() {
    super();
    this.setUrl("/modules/enroll/{moduleId}").setMethod(RequestMethod.GET);
  }
}

export type getSolverOutputPath =
  paths["/api/solver/jobs/{jobId}/result"]["get"]["parameters"]["path"];

export type getSolverOutputRes =
  paths["/api/solver/jobs/{jobId}/result"]["get"]["responses"]["200"]["content"]["application/json"];

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

export type pollSolverOutputPath =
  paths["/api/solver/jobs/{jobId}"]["get"]["parameters"]["path"];
export type pollSolverOutputRes =
  paths["/api/solver/jobs/{jobId}"]["get"]["responses"]["200"]["content"]["application/json"];
export class pollSolverOutputBuilder extends RequestBuilder<
  pollSolverOutputPath,
  undefined,
  pollSolverOutputRes
> {
  constructor() {
    super();
    this.setUrl("/solver/jobs/{jobId}").setMethod(RequestMethod.GET);
  }
}
