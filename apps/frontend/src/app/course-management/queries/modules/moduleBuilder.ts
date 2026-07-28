import { components, paths } from "@/lib/api";
import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";
import { createModuleRes } from "@/app/builder/utils/modules/requestBuilders";

export type moduleDTO = components["schemas"]["ModuleSingleResponseDto"];
export type getAllModules = paths["/api/modules"]["get"];

export type getAllModulesQueries = getAllModules["parameters"]["query"];
export type getAllModulesRes =
  getAllModules["responses"]["200"]["content"]["application/json"]["modules"];

export async function fetchAllModules(
  queries: getAllModulesQueries,
): Promise<getAllModulesRes> {
  const baseUrl =
    (typeof window === "undefined"
      ? process.env.API_URL
      : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:3000";

  let path = "/modules";

  if (!baseUrl.includes("/api")) path = "/api" + path;

  const searchParams = new URLSearchParams();

  if (queries?.GroupID) {
    searchParams.append("GroupID" as keyof typeof queries, queries.GroupID);
  }
  if (queries?.courseId) {
    searchParams.append("courseId" as keyof typeof queries, queries.courseId);
  }
  if (queries?.universityId) {
    searchParams.append(
      "universityId" as keyof typeof queries,
      queries.universityId,
    );
  }
  if (queries?.moduleCode) {
    searchParams.append(
      "moduleCode" as keyof typeof queries,
      queries.moduleCode,
    );
  }
  if (queries?.userEnrollment) {
    searchParams.append(
      "userEnrollment" as keyof typeof queries,
      String(queries.userEnrollment), // bool
    );
  }

  const queryStr = searchParams.toString();
  const URL = queryStr ? `${baseUrl}${path}?${queryStr}` : baseUrl + path;

  const response = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  } else {
    const data = await response.json();
    return data.modules as getAllModulesRes;
  }
}

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
