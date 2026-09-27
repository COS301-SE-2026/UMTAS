import { api } from "@/components/tanstack/getQueryClient";
import { components, paths } from "@/lib/api";
import { RequestBuilder, RequestMethod } from "../../request";

export type createSession = paths["/api/vision-sessions"]["post"];
export type createSessionBody =
  createSession["requestBody"]["content"]["application/json"];

export type createSessionResp =
  createSession["responses"]["201"]["content"]["application/json"];

export class CreateSessionBuilder extends RequestBuilder<
  undefined,
  createSessionBody,
  createSessionResp
> {
  constructor() {
    super();
    this.setUrl("/vision-sessions").setMethod(RequestMethod.POST);
  }
}

export type getAllSession = paths["/api/vision-sessions"]["get"];
export type getAllSessionFilters = getAllSession["parameters"]["query"];
export type getAllSessionResp =
  getAllSession["responses"]["200"]["content"]["application/json"];

export async function getAllvmSessions(
  params: getAllSessionFilters,
): Promise<getAllSessionResp> {
  return api
    .get("/vision-sessions", {
      searchParams: params as getAllSessionFilters,
    })
    .json<getAllSessionResp>();
}
