import { queryOptions } from "@tanstack/react-query";
import { fetchAllModules, getAllModulesQueries } from "./moduleBuilder";

export function getAllModulesQ(queries: getAllModulesQueries) {
  return queryOptions({
    queryKey: ["Modules", "Courses"],
    queryFn: async () => {
      const result = await fetchAllModules(queries);
      return result;
    },
  });
}
