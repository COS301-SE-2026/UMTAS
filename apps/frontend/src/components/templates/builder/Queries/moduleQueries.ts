import {
  createModulesBuilder,
  deleteModulesById,
  getAllModulesBuilder,
  updateModuleByIdBody,
  updateModulesBuilder,
} from "@/app/builder/utils/modules/requestBuilders";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { mutationOptions, queryOptions } from "@tanstack/react-query";

export function getAllModulesQ() {
  return queryOptions({
    queryKey: ["modules"] as const,
    queryFn: async () => (await new getAllModulesBuilder().send({})).modules,
  });
}

export function addModuleMut() {
  return mutationOptions({
    mutationFn: async () => {
      const nextNum = Math.round(Math.random() * 1000);
      const builder = new createModulesBuilder();
      return await builder.send({
        body: {
          moduleCode: `MOD-${nextNum}`,
          moduleName: `Module ${nextNum}`,
          styling: { colour: "#3B82F6" },
          moduleDescription: "Fill in",
        },
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllModulesQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}

export function removeModuleMut() {
  return mutationOptions({
    mutationFn: async (moduleID: string | null) => {
      if (moduleID == null) {
        return;
      }
      return new deleteModulesById().send({
        paths: {
          moduleId: moduleID,
        },
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllModulesQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}

export function updateModuleMut() {
  return mutationOptions({
    mutationFn: async (vars: {
      moduleID: string;
      module: updateModuleByIdBody;
    }) => {
      return new updateModulesBuilder().send({
        paths: {
          moduleId: vars.moduleID,
        },
        body: {
          Core: {},
          moduleCode: vars.module.moduleCode,
          moduleDescription: vars.module.moduleDescription,
          moduleName: vars.module.moduleName,
          styling: vars.module.styling,
        },
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllModulesQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}
