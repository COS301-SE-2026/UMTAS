import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { RequestBuilder, RequestMethod } from "../request";
import { paths, components } from "@/lib/api";
import { getQueryClient } from "@/components/tanstack/getQueryClient";

export type CreateAcRestriction =
  paths["/api/academic-calendar/{id}/restrictions"]["post"];

export type CreateAcRestrictionPath = CreateAcRestriction["parameters"]["path"];
export type CreateAcRestrictionResp =
  CreateAcRestriction["responses"]["201"]["content"]["application/json"];
export type CreateAcRestrictionBody =
  CreateAcRestriction["requestBody"]["content"]["application/json"];

export class CreateAcRestrictionBuilder extends RequestBuilder<
  CreateAcRestrictionPath,
  CreateAcRestrictionBody,
  CreateAcRestrictionResp
> {
  constructor() {
    super();
    this.setUrl("/academic-calendar/{id}/restrictions").setMethod(
      RequestMethod.POST,
    );
  }
}

export const CreateAcMutation = mutationOptions({
  mutationFn: ({
    body,
    paths,
  }: {
    body: CreateAcRestrictionBody;
    paths: CreateAcRestrictionPath;
  }) => {
    return new CreateAcRestrictionBuilder().send({
      paths: paths,
      body: body,
    });
  },
  onSuccess: () => {
    getQueryClient().invalidateQueries({
      queryKey: ["Restrictions"],
    });
  },
});

type UpdateAcRestriction =
  paths["/api/academic-calendar/{id}/restrictions/{restrictionId}"]["put"];

export type UpdateAcRestrictionPaths =
  UpdateAcRestriction["parameters"]["path"];

export type UpdateAcRestrictionBody =
  UpdateAcRestriction["requestBody"]["content"]["application/json"];

export type UpdateAcRestrictionResp =
  UpdateAcRestriction["responses"]["200"]["content"]["application/json"];

export class UpdateAcRestrictionBuilder extends RequestBuilder<
  UpdateAcRestrictionPaths,
  UpdateAcRestrictionBody,
  UpdateAcRestrictionResp
> {
  constructor() {
    super();
    this.setUrl(
      "/academic-calendar/{id}/restrictions/{restrictionId}",
    ).setMethod(RequestMethod.PUT);
  }
}

export const UpdateRestrictionMutation = mutationOptions({
  mutationFn: ({
    body,
    paths,
  }: {
    body: UpdateAcRestrictionBody;
    paths: UpdateAcRestrictionPaths;
  }) => {
    return new UpdateAcRestrictionBuilder().send({
      paths: paths,
      body: body,
    });
  },
  onSuccess: () => {
    getQueryClient().invalidateQueries({
      queryKey: ["Restrictions"],
    });
  },
});

type getAllRestrictions =
  paths["/api/academic-calendar/{id}/restrictions"]["get"];

export type getAcRestrictionPaths = getAllRestrictions["parameters"]["path"];

export type getAcRestrictionResp =
  getAllRestrictions["responses"]["200"]["content"]["application/json"];

export type SingleRestrictionResp =
  getAcRestrictionResp["restrictions"][number];

export class getAcRestrictionBuilder extends RequestBuilder<
  getAcRestrictionPaths,
  undefined,
  getAcRestrictionResp
> {
  constructor() {
    super();
    this.setUrl("/academic-calendar/{id}/restrictions").setMethod(
      RequestMethod.GET,
    );
  }
}

export function GetAllRestrictions(paths?: getAcRestrictionPaths) {
  return queryOptions({
    queryKey: ["Restrictions", paths],
    queryFn: async () => {
      const res = await new getAcRestrictionBuilder().send({
        paths: paths,
      });
      console.log(res, "Restrictions ");
      return res;
    },
  });
}

export type RestrictionTypes = components["schemas"]["CalendarRestrictionType"];
