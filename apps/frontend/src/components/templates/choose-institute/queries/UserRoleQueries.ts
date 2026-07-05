import { queryOptions } from "@tanstack/react-query";
import { getallUnisBuilder } from "./builders";

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
