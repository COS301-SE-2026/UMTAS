import { api, getQueryClient } from "@/components/tanstack/getQueryClient";
import { components, paths } from "@/lib/api";
import { RequestBuilder, RequestMethod } from "../../request";
import { mutationOptions, queryOptions, useQuery } from "@tanstack/react-query";

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
  return await api
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
  paths["/api/vision-sessions/{sessionId}"]["delete"]["responses"]["200"]["content"]["application/json"];

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

export function getAllSessionQuery(filters: getAllSessionFilters) {
  return queryOptions({
    queryKey: ["VM_SESSIONS", filters],
    queryFn: async () => {
      return (await getAllvmSessions(filters)).sessions;
    },
  });
}

export function createSessionMut() {
  return mutationOptions({
    mutationFn: async (body: createSessionBody) => {
      const result = await new CreateSessionBuilder().send({ body: body });
      return result;
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["VM_SESSIONS"],
      });
    },
  });
}

export function patchSessionMut() {
  return mutationOptions({
    mutationFn: async (vars: {
      body: patchSessionBody;
      path: patchSessionPath;
    }) => {
      const result = await new patchSessionBuilder().send({
        body: vars.body,
        paths: vars.path,
      });
      return result;
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["VM_SESSIONS"],
      });
    },
  });
}

export function deleteSessionMut() {
  return mutationOptions({
    mutationFn: async (vars: { path: patchSessionPath }) => {
      const result = await new deleteSessionBuilder().send({
        paths: vars.path,
      });
      return result;
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["VM_SESSIONS"],
      });
    },
  });
}
