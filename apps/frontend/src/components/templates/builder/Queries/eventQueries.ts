import {
  createEventsBuilder,
  deleteEventById,
  getAllEventsBuilder,
  updateEventByID,
  updateEventByIdBody,
  updateEventByIdPath,
} from "@/app/builder/utils/events/eventRequestBuilder";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { mutationOptions, queryOptions } from "@tanstack/react-query";

export function getAllEventsQ() {
  return queryOptions({
    queryKey: ["events"] as const,
    queryFn: async () => (await new getAllEventsBuilder().send({})).events,
  });
}

export function addUniEventMut() {
  return mutationOptions({
    mutationFn: async () => {
      const today = new Date();
      const nextNum = Math.round(Math.random() * 1000);
      return new createEventsBuilder().send({
        body: {
          eventCriteria: {
            date: today.toISOString().split("T")[0],
            type: "university",
            startTime: "",
            endTime: "",
          },
          eventName: "Event",
          eventCode: `EVE-${nextNum}`,
          isRecurring: false,
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
