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

import type { paths } from "@/lib/api";

export type BuilderEventV2 = paths["/api/builder/events"]["post"];

export type BuilderEventV2Body =
  BuilderEventV2["requestBody"]["content"]["application/json"];

export type BuilderEventV2Resp =
  BuilderEventV2["responses"]["201"]["content"]["application/json"];

export function getAllEventsQ() {
  return queryOptions({
    queryKey: ["events"] as const,
    queryFn: async () => {
      const result = (await new getAllEventsBuilder().send({})).events;
      console.log(result, "Sent event ");
      return result;
    },
  });
}

export function addUniEventMut() {
  return mutationOptions({
    mutationFn: async (vars: { body: CreateEventBody }) => {
      console.log(vars.body);
      const result = new createEventsBuilder().send({
        body: vars.body,
      });
      console.log("result", await result);
      return result;
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllEventsQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}

export function removeEventMut() {
  return mutationOptions({
    mutationFn: async (eventID: string | null) => {
      if (eventID == null) {
        return;
      }
      return new deleteEventById().send({
        paths: {
          id: eventID,
        },
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllEventsQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}

export function updateEventMut() {
  return mutationOptions({
    mutationFn: async (vars: {
      path: updateEventByIdPath;
      body: updateEventByIdBody;
    }) => {
      return new updateEventByID().send({
        paths: vars.path,
        body: vars.body,
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllEventsQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}
