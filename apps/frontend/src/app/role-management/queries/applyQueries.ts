import { queryOptions } from "@tanstack/react-query";
import {
  getAllApplicationsBuilder,
  getAllApplicationsPath,
  getAllApplicationsBody,
} from "./builder";

export function getAllUni(
  path: getAllApplicationsPath,
  body: getAllApplicationsBody,
) {
  return queryOptions({
    queryKey: ["role-applications", body.pending], // caches a pending and non pending
    queryFn: async () => {
      const result = new getAllApplicationsBuilder().send({
        paths: path,
        body: body,
      });
      return result;
    },
  });
}
