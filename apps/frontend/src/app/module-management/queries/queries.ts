import { queryOptions } from "@tanstack/react-query";

export function getAllEventsQ(moduleID: string) {
  return queryOptions({
    queryKey: ["events", moduleID] as const,
    queryFn: async () => {
      const result = "";
      return result;
    },
  });
}
