import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { applyBody, applyUniBuilder, getallUnisBuilder } from "./builders";
import { getQueryClient } from "@/components/tanstack/getQueryClient";

/*
export function useUserRole() {
  return useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const response = await fetch("/api/user-role");
      if (!response.ok) {
        throw new Error("Failed to fetch user role");
      }
      return response.json();
    },
  });
}
*/

export function getAllUni() {
  return queryOptions({
    queryKey: ["university"],
    queryFn: async () => {
      const result = new getallUnisBuilder().send({});
      return result;
    },
  });
}

export function applyMutator() {
  return mutationOptions({
    mutationFn: async (body: applyBody) => {
      const builder = new applyUniBuilder();
      return builder.send({ body: body });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllUni().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}
