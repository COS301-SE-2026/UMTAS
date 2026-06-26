import {
  createModulesBuilder,
  deleteModulesById,
  getAllModulesBuilder,
  updateModulesBuilder,
} from "@/app/builder/utils/modules/requestBuilders";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { randomInt } from "node:crypto";

export function getAllModulesQ() {
  return queryOptions({
    queryKey: ["modules"] as const,
    queryFn: async () => (await new getAllModulesBuilder().send({})).modules,
  });
}

export function addModuleMut() {
  return mutationOptions({
    mutationFn: async () => {
      const nextNum = randomInt(999);
      const builder = new createModulesBuilder();
      return await builder.send({
        body: {
          code: `MOD-${nextNum}`,
          name: `Module ${nextNum}`,
          styling: "#3B82F6",
        },
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllModulesQ().queryKey,
      });
    },
  });
}

export function removeModuleMut() {
  return mutationOptions({
    mutationFn: async (moduleID: number | null) => {
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
  });
}

export function updateModuleMut() {
  return mutationOptions({
    mutationFn: async (vars: {
      moduleID: number;
      module: { code?: string; dsc?: string; name?: string; styling?: string };
    }) => {
      return new updateModulesBuilder().send({
        paths: {
          moduleId: vars.moduleID,
        },
        body: {
          code: vars.module.code,
          description: vars.module.dsc,
          name: vars.module.name,
          styling: vars.module.styling,
        },
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllModulesQ().queryKey,
      });
    },
  });
}
