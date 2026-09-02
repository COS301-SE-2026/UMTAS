import {
  CreateEventBody,
  createEventsBuilder,
  deleteEventById,
  getAllEventsBuilder,
  getallEventsReq,
  getAllEventsRes,
  updateEventByID,
  updateEventByIdBody,
  updateEventByIdPath,
} from "@/app/builder/utils/events/eventRequestBuilder";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { mutationOptions, queryOptions } from "@tanstack/react-query";

import type { paths } from "@/lib/api";
import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

export type BuilderEventV2 = paths["/api/builder/events"]["post"];

export type BuilderEventV2Body =
  BuilderEventV2["requestBody"]["content"]["application/json"];

export type BuilderEventV2Resp =
  BuilderEventV2["responses"]["201"]["content"]["application/json"];

export class CreateBuilderEventsV2 extends RequestBuilder<
  undefined,
  BuilderEventV2Body,
  BuilderEventV2Resp
> {
  constructor() {
    super();
    this.setUrl("/builder/events").setMethod(RequestMethod.POST);
  }
}

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
    mutationFn: async (vars: { body: BuilderEventV2Body }) => {
      console.log(vars.body);
      const result = new CreateBuilderEventsV2().send({
        body: vars.body,
      });
      console.log("result", await result);
      return await result;
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

import {
  updateEventVenueBuilder,
  updateEventVenueBody,
  updateEventVenuePath,
} from "@/app/builder/utils/events/eventRequestBuilder";

export function updateEventVenueMut() {
  return mutationOptions({
    mutationFn: async (vars: {
      path: updateEventVenuePath;
      body: updateEventVenueBody;
    }) => {
      const result = await new updateEventVenueBuilder().send({
        paths: vars.path,
        body: vars.body,
      });
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
