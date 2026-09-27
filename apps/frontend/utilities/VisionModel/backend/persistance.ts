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

export type patchSession = paths["/api/vision-sessions/{sessionId}"]["patch"];
export type patchSessionPath = patchSession["parameters"]["path"];
export type patchSessionBody =
  patchSession["requestBody"]["content"]["application/json"];

export type patchSessionResp =
  patchSession["responses"]["200"]["content"]["application/json"];

export class patchSessionBuilder extends RequestBuilder<
  patchSessionPath,
  patchSessionBody,
  patchSessionResp
> {
  constructor() {
    super();
    this.setUrl("/vision-sessions/{sessionId}").setMethod(RequestMethod.PATCH);
  }
}

export type deleteSessionResponse =
  paths["/api/vision-sessions/{sessionId}"]["delete"]["responses"]["200"];

export class deleteSessionBuilder extends RequestBuilder<
  patchSessionPath,
  undefined,
  deleteSessionResponse
> {
  constructor() {
    super();
    this.setUrl("/vision-sessions/{sessionId}").setMethod(RequestMethod.DELETE);
  }
}
