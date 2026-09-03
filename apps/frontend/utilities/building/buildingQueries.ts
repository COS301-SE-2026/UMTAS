import {
  createBuildingBody,
  createBuildingBuilder,
  getAllBuildingsBuilder,
  getAllBuildingsQuery,
  updateBuildingLocationBody,
  updateBuildingLocationBuilder,
  updateBuildingLocationPath,
} from "./buildingRequestBuilder";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { mutationOptions, queryOptions } from "@tanstack/react-query";

export function getAllBuildingsQ(query?: getAllBuildingsQuery) {
  return queryOptions({
    queryKey: ["buildings"] as const,
    queryFn: async () => {
      const result = (await new getAllBuildingsBuilder().send({ paths: query }))
        .buildings;
      //console.log(result, "Sent building ");
      return result;
    },
  });
}

export function createBuildingMut() {
  return mutationOptions({
    mutationFn: async (vars: { body: createBuildingBody }) => {
      console.log(vars.body);
      const result = new createBuildingBuilder().send({
        body: vars.body,
      });
      //console.log("result", await result);
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

export function updateBuildingLocationMut() {
  return mutationOptions({
    mutationFn: async (vars: {
      body: updateBuildingLocationBody;
      path: updateBuildingLocationPath;
    }) => {
      //console.log(vars.body);
      const result = new updateBuildingLocationBuilder().send({
        body: vars.body,
        paths: vars.path,
      });
      //console.log("result", await result);
      return result;
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["buildings"],
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}
