import { queryOptions } from "@tanstack/react-query";
import {
  getAllVisionSessionsBuilder,
  getAllVisionSessionsQuery,
} from "./VisionRequestBuilder";

export function getUniversityStatsQ(query: getAllVisionSessionsQuery) {
  return queryOptions({
    queryKey: ["vision", "sessions"] as const,
    queryFn: async () => {
      const result = await new getAllVisionSessionsBuilder().send({ query });
      return result;
    },
    select: (response) => response.sessions,
  });
}
