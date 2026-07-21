import { queryOptions } from "@tanstack/react-query";
import { getAllEventsAdmin } from "./requests";

export function getAllEventsAdminQ(moduleID: string) {
  return queryOptions({
    queryKey: ["events", moduleID] as const,
    queryFn: async () => {
      const result = await getAllEventsAdmin(moduleID);
      console.log(result);
      return result;
    },
  });
}
