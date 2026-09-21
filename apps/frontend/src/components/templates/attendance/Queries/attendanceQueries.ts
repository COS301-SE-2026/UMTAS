import { mutationOptions } from "@tanstack/react-query";

import type { paths } from "@/lib/api";
import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

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
    mutationFn: async (guestCount: number) => {
      return new UpdateAttendanceCount().send({
        body: {
          guestCount,
        },
      });
    },
    onError: (err) => console.error("Failed to update attendance count", err),
  });
}
