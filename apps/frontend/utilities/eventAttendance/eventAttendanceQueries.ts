import {
  CreateEventBody,
  createEventsBuilder,
  deleteEventById,
  getAllEventsBuilder,
  updateEventByID,
  updateEventByIdBody,
  updateEventByIdPath,
} from "@/app/builder/utils/events/eventRequestBuilder";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  createEventAttendanceBody,
  createEventAttendanceBuilder,
  deleteEventAttendanceById,
  getEventAttendanceBuilder,
  getEventAttendanceByIdBuilder,
  getEventAttendanceByIdPath,
  getEventAttendanceQuery,
  updateEventAttendanceByIdBody,
  updateEventAttendanceByIdBuilder,
  updateEventAttendanceByIdPath,
} from "./eventAttendanceBuilder";

export function getAllEventAttendanceQ(query?: getEventAttendanceQuery) {
  return queryOptions({
    queryKey: ["eventAttendance", query] as const,
    queryFn: async () => {
      const result = await new getEventAttendanceBuilder().send({
        paths: query,
      });
      return result;
    },
  });
}

export function getEventAttendanceByIdQ(path: getEventAttendanceByIdPath) {
  return queryOptions({
    queryKey: ["eventAttendance", { id: path?.attendanceId }] as const,
    queryFn: async () => {
      const result = await new getEventAttendanceByIdBuilder().send({
        paths: path,
      });
      return result;
    },
  });
}

export function addEventAttendanceMut() {
  return mutationOptions({
    mutationFn: async (vars: { body: createEventAttendanceBody }) => {
      const result = await new createEventAttendanceBuilder().send({
        body: vars.body,
      });
      return result;
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["eventAttendance"],
      });
    },
    onError: (error) => console.error("Could not create attendance", error),
  });
}

export function removeEventAttendanceMut() {
  return mutationOptions({
    mutationFn: async (attendanceId: string | null) => {
      if (attendanceId == null) {
        return;
      }
      return new deleteEventAttendanceById().send({
        paths: {
          attendanceId: attendanceId,
        },
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["eventAttendance"],
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}

export function updateEventAttendanceMut() {
  return mutationOptions({
    mutationFn: async (vars: {
      path: updateEventAttendanceByIdPath;
      body: updateEventAttendanceByIdBody;
    }) => {
      return new updateEventAttendanceByIdBuilder().send({
        paths: vars.path,
        body: vars.body,
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["eventAttendance"],
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}
