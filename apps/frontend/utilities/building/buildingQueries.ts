import {
  createBuildingBody,
  createBuildingBuilder,
  deleteBuildingBuilder,
  deleteBuildingPath,
  getAllBuildingsBuilder,
  getAllBuildingsHeatmapBuilder,
  getAllBuildingsHeatmapQuery,
  getAllBuildingsQuery,
  getBuildingByIdBuilder,
  getBuildingByIDPath,
  getBuildingHeatmapBuilder,
  getBuildingHeatmapPath,
  getBuildingHeatmapQuery,
  updateBuildingLocationBody,
  updateBuildingLocationBuilder,
  updateBuildingLocationPath,
} from "./buildingRequestBuilder";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { resumeToPipeableStream } from "react-dom/server";

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

export function getBuildingByIdQ(path: getBuildingByIDPath) {
  return queryOptions({
    queryKey: ["buildings", path.buildingId] as const,
    queryFn: async () => {
      const result = await new getBuildingByIdBuilder().send({ paths: path });
      return result;
    },
  });
}

export function createBuildingMut() {
  return mutationOptions({
    mutationFn: async (vars: { body: createBuildingBody }) => {
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

//todo rename since it does not only update the building location
export function updateBuildingMut() {
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

export function deleteBuildingMut() {
  return mutationOptions({
    mutationFn: async (vars: { path: deleteBuildingPath }) => {
      const result = new deleteBuildingBuilder().send({ paths: vars.path });
      return result;
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["buildings"] });
    },
    onError: (error) => console.error("mutation has failed", error),
  });
}

export function getBuildingHeatmapQ(
  path: getBuildingHeatmapPath,
  query?: getBuildingHeatmapQuery,
) {
  return queryOptions({
    queryKey: [
      "buildings",
      "heatmap",
      path.buildingId,
      query?.date,
      query?.view,
    ] as const,
    queryFn: async () => {
      const result = await new getBuildingHeatmapBuilder().send({
        paths: { ...path, ...query },
      });
      return result;
    },
  });
}

export function getAllBuildingsHeatmapQ(query?: getAllBuildingsHeatmapQuery) {
  return queryOptions({
    queryKey: ["buildings, heatmap, all", query?.date, query?.view] as const,
    queryFn: async () => {
      const result = (await new getAllBuildingsHeatmapBuilder().send({ query }))
        .buildings;
      return result;
    },
  });
}
