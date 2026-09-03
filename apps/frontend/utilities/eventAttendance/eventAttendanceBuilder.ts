import { paths } from "@/lib/api";
import { RequestBuilder, RequestMethod } from "../request";
import { api } from "@/components/tanstack/getQueryClient";

export type createEventAttendanceBody =
  paths["/api/attendance"]["post"]["requestBody"]["content"]["application/json"];
export type createEventAttendanceRes =
  paths["/api/attendance"]["post"]["responses"]["201"]["content"]["application/json"];

export type getEventAttendanceQuery =
  paths["/api/attendance"]["get"]["parameters"]["query"];
export type getEventAttendanceRes =
  paths["/api/attendance"]["get"]["responses"]["200"]["content"]["application/json"];

export type getEventAttendanceByIdPath =
  paths["/api/attendance/{attendanceId}"]["get"]["parameters"]["path"];
export type getEventAttendanceByIdRes =
  paths["/api/attendance/{attendanceId}"]["get"]["responses"]["200"]["content"]["application/json"];

export type updateEventAttendanceByIdBody =
  paths["/api/attendance/{attendanceId}"]["patch"]["requestBody"]["content"]["application/json"];
export type updateEventAttendanceByIdRes =
  paths["/api/attendance/{attendanceId}"]["patch"]["responses"]["200"]["content"]["application/json"];
export type updateEventAttendanceByIdPath =
  paths["/api/attendance/{attendanceId}"]["patch"]["parameters"]["path"];

export type deleteEventAttendanceByIdPath =
  paths["/api/attendance/{attendanceId}"]["delete"]["parameters"]["path"];
export type deleteEventAttendanceByIdRes =
  paths["/api/attendance/{attendanceId}"]["delete"]["responses"]["200"]["content"]["application/json"];

export class createEventAttendanceBuilder extends RequestBuilder<
  undefined,
  createEventAttendanceBody,
  createEventAttendanceRes
> {
  constructor() {
    super();
    this.setUrl("/attendance").setMethod(RequestMethod.POST);
  }
}

export class getEventAttendanceBuilder extends RequestBuilder<
  getEventAttendanceQuery,
  undefined,
  getEventAttendanceRes
> {
  constructor() {
    super();
    this.setUrl("/attendance").setMethod(RequestMethod.GET);
  }
}

export async function getAllAttendanceKy(
  params: getEventAttendanceQuery,
): Promise<getEventAttendanceRes> {
  return api
    .get("/attendance", {
      searchParams: params as getEventAttendanceQuery,
    })
    .json<getEventAttendanceRes>();
}

export class getEventAttendanceByIdBuilder extends RequestBuilder<
  getEventAttendanceByIdPath,
  undefined,
  getEventAttendanceByIdRes
> {
  constructor() {
    super();
    this.setUrl("/attendance/{attendanceId}").setMethod(RequestMethod.GET);
  }
}

export class updateEventAttendanceByIdBuilder extends RequestBuilder<
  updateEventAttendanceByIdPath,
  updateEventAttendanceByIdBody,
  updateEventAttendanceByIdRes
> {
  constructor() {
    super();
    this.setUrl("/attendance/{attendanceId}").setMethod(RequestMethod.PATCH);
  }
}

export class deleteEventAttendanceById extends RequestBuilder<
  deleteEventAttendanceByIdPath,
  undefined,
  deleteEventAttendanceByIdRes
> {
  constructor() {
    super();
    this.setUrl("/attendance/{attendanceId}").setMethod(RequestMethod.DELETE);
  }
}
