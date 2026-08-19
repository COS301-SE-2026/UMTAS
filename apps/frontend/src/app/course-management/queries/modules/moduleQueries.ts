import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  CreateModuleBody,
  CreateModuleBuilderAdmin,
  updateModStylingBody,
  updateModStylingPath,
  updateModuleBody,
  updateModuleBuilder,
  updateModulePath,
  updateStylingBuilder,
} from "./moduleBuilder";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { getAllCoursesQ } from "../courses/courseQueries";

import {
  fetchAllModulesv2,
  getAllModulesV2Params,
} from "../../../../../utilities/V2-Builders/Modules";

export function getAllModCoursesQ(queries?: getAllModulesV2Params) {
  return queryOptions({
    queryKey: ["Modules"],
    queryFn: async () => {
      const result = await fetchAllModulesv2(queries);
      return result.modules;
    },
  });
}

export function updateModQ() {
  return mutationOptions({
    mutationFn: async (vars: {
      body: updateModuleBody;
      path: updateModulePath;
    }) => {
      const builder = new updateModuleBuilder();
      return builder.send({ body: vars.body, paths: vars.path });
    },
    onSuccess: () =>
      getQueryClient().invalidateQueries({ queryKey: ["Modules"] }),
    onError: (err) => console.error("mutation failed", err),
  });
}
export function updateModStylingQ() {
  return mutationOptions({
    mutationFn: async (vars: {
      body: updateModStylingBody;
      path: updateModStylingPath;
    }) => {
      const builder = new updateStylingBuilder();
      return builder.send({ body: vars.body, paths: vars.path });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}

export function CreateModuleMutAdmin() {
  return mutationOptions({
    mutationFn: async (body: CreateModuleBody) => {
      const builder = new CreateModuleBuilderAdmin();
      return builder.send({ body: body });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllCoursesQ().queryKey,
      });
      getQueryClient().invalidateQueries({
        queryKey: getAllModCoursesQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}
