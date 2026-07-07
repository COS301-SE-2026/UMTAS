import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  getAllApplicationsBuilder,
  getAllApplicationsPath,
  getAllApplicationsBody,
  approveBuilder,
  approveApplicationsBody,
} from "./builder";
import { getQueryClient } from "@/components/tanstack/getQueryClient";

export function getAllApplicationsQ(
  path?: getAllApplicationsPath,
  body?: getAllApplicationsBody,
) {
  return queryOptions({
    queryKey: ["role-applications"], // caches a pending and non pending
    queryFn: async () => {
      const result = new getAllApplicationsBuilder().send({
        paths: path,
        body: body,
      });
      return result;
    },
  });
}

export function ApproveMutator() {
  return mutationOptions({
    mutationFn: async (body: approveApplicationsBody) => {
      const builder = new approveBuilder();
      return builder.send({
        body: body,
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllApplicationsQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}
