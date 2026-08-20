import { mutationOptions } from "@tanstack/react-query";
import { RequestBuilder, RequestMethod } from "../request";
import { paths } from "@/lib/api";

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
    return new CreateAcademicCalendarBuilder().send({
      body: body,
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
    this.setUrl("/academic-calendar/{id}").setMethod(RequestMethod.POST);
  }
}
