import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { RequestBuilder, RequestMethod } from "../request";
import { paths } from "@/lib/api";
import { getQueryClient } from "@/components/tanstack/getQueryClient";

type CreateAcademicCalendar = paths["/api/academic-calendar"]["post"];
export type CreateAcademicCalendarBody =
  CreateAcademicCalendar["requestBody"]["content"]["application/json"];

export type CreateAcademicCalendarResp =
  CreateAcademicCalendar["responses"]["201"]["content"]["application/json"];

export class CreateAcademicCalendarBuilder extends RequestBuilder<
  undefined,
  CreateAcademicCalendarBody,
  CreateAcademicCalendarResp
> {
  constructor() {
    super();
    this.setUrl("/academic-calendar").setMethod(RequestMethod.POST);
  }
}

export const CreateAcMutation = mutationOptions({
  mutationFn: (body: CreateAcademicCalendarBody) => {
    console.log("created AC");
    return new CreateAcademicCalendarBuilder().send({
      body: body,
    });
  },
  onSuccess: () => {
    getQueryClient().invalidateQueries({
      queryKey: ["Academic-Calendar"],
    });
  },
});

type getAcademicCalendar = paths["/api/academic-calendar/{id}"]["get"];

export type getAcademicCalendarPath = getAcademicCalendar["parameters"]["path"];

export type getAcademicCalendarResp =
  getAcademicCalendar["responses"]["200"]["content"]["application/json"];

export class GetAcademicCalendarBuilder extends RequestBuilder<
  getAcademicCalendarPath,
  undefined,
  getAcademicCalendarResp
> {
  constructor() {
    super();
    this.setUrl("/academic-calendar/{id}").setMethod(RequestMethod.GET);
  }
}

type getAllAC = paths["/api/academic-calendar"]["get"];

export type getAllAcResp =
  getAllAC["responses"]["200"]["content"]["application/json"];

export class GetAllAcBuilder extends RequestBuilder<
  undefined,
  undefined,
  getAllAcResp
> {
  constructor() {
    super();
    this.setUrl("/academic-calendar").setMethod(RequestMethod.GET);
  }
}

export function getAllAcQuery() {
  return queryOptions({
    queryKey: ["Academic-Calendar"],
    queryFn: async () => {
      const result = new GetAllAcBuilder().send({});
      return await result;
    },
  });
}

type getPublicAC = paths["/api/academic-calendar/public"]["get"];

export type getPublicAcResp =
  getPublicAC["responses"]["200"]["content"]["application/json"];

export class GetPublicAcBuilder extends RequestBuilder<
  undefined,
  undefined,
  getPublicAcResp
> {
  constructor() {
    super();
    this.setUrl("/academic-calendar/public").setMethod(RequestMethod.GET);
  }
}

export function getPublicAcQuery() {
  return queryOptions({
    queryKey: ["Public-Academic-Calendar"],
    queryFn: async () => {
      return await new GetPublicAcBuilder().send({});
    },
  });
}

type UpdateAcSubscriptions =
  paths["/api/academic-calendar/{id}/subscriptions"]["put"];

export type UpdateAcSubscriptionsPath =
  UpdateAcSubscriptions["parameters"]["path"];
export type UpdateAcSubscriptionsBody =
  UpdateAcSubscriptions["requestBody"]["content"]["application/json"];
export type UpdateAcSubscriptionsResp =
  UpdateAcSubscriptions["responses"]["200"]["content"]["application/json"];

export class UpdateAcSubscriptionsBuilder extends RequestBuilder<
  UpdateAcSubscriptionsPath,
  UpdateAcSubscriptionsBody,
  UpdateAcSubscriptionsResp
> {
  constructor() {
    super();
    this.setUrl("/academic-calendar/{id}/subscriptions").setMethod(
      RequestMethod.PUT,
    );
  }
}

export const UpdateAcSubscriptionsMutation = mutationOptions({
  mutationFn: ({
    paths,
    body,
  }: {
    paths: UpdateAcSubscriptionsPath;
    body: UpdateAcSubscriptionsBody;
  }) => {
    return new UpdateAcSubscriptionsBuilder().send({ paths, body });
  },
  onSuccess: () => {
    getQueryClient().invalidateQueries({
      queryKey: ["Academic-Calendar"],
    });
  },
});
