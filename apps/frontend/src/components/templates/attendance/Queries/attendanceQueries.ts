import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { mutationOptions, queryOptions } from "@tanstack/react-query";

import type { paths } from "@/lib/api";

import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

export type AttendanceSlotsEndpoint =
  paths["/api/attendance/operator/slots"]["get"];

export type AttendanceSlotsResponse =
  AttendanceSlotsEndpoint["responses"]["200"]["content"]["application/json"];

export class GetAttendanceSlots extends RequestBuilder<
  undefined,
  undefined,
  AttendanceSlotsResponse
> {
  constructor() {
    super();

    this.setUrl("/attendance/operator/slots").setMethod(RequestMethod.GET);
  }
}

export function getAttendanceSlotsQ() {
  return queryOptions({
    queryKey: ["attendance-slots"] as const,

    queryFn: async () => {
      return new GetAttendanceSlots().send({});
    },
  });
}

export type AttendanceCountEndpoint =
  paths["/api/attendance/records/camera"]["put"];

export type AttendanceCountBody =
  AttendanceCountEndpoint["requestBody"]["content"]["application/json"];

export type AttendanceCountResponse =
  AttendanceCountEndpoint["responses"]["200"]["content"]["application/json"];

export class UpdateAttendanceCount extends RequestBuilder<
  undefined,
  AttendanceCountBody,
  AttendanceCountResponse
> {
  constructor() {
    super();

    this.setUrl("/attendance/records/camera").setMethod(RequestMethod.PUT);
  }
}

export function updateAttendanceCountMut() {
  return mutationOptions({
    mutationFn: async (body: AttendanceCountBody) => {
      return new UpdateAttendanceCount().send({
        body,
      });
    },

    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAttendanceSlotsQ().queryKey,
      });
    },
  });
}
