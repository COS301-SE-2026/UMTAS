import {
  CreateEventBody,
  createEventsBuilder,
  deleteEventById,
  getAllEventsBuilder,
  updateEventByID,
  updateEventByIdBody,
  updateEventByIdPath,
} from "@/app/builder/utils/events/eventRequestBuilder";
import {
  createBuildingBody,
  createBuildingBuilder,
  createBuildingPath,
  getAllBuildingsBuilder,
} from "./buildingRequestBuilder";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { mutationOptions, queryOptions } from "@tanstack/react-query";

export function getAllBuildingsQ() {
  return queryOptions({
    queryKey: ["buildings"] as const,
    queryFn: async () => {
      const result = (await new getAllBuildingsBuilder().send({})).buildings;
      console.log(result, "Sent building ");
      return result;
    },
  });
}

export function createBuildingMut() {
  return mutationOptions({
    mutationFn: async (vars: {
      body: createBuildingBody;
      path: createBuildingPath;
    }) => {
      console.log(vars.body);
      const result = new createBuildingBuilder().send({
        body: vars.body,
        paths: vars.path,
      });
      console.log("result", await result);
      return result;
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllBuildingsQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}
