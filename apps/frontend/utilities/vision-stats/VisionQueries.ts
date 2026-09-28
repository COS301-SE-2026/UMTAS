import { queryOptions } from "@tanstack/react-query";
import {
  getAllVisionSessionsBuilder,
  getAllVisionSessionsQuery,
} from "./VisionRequestBuilder";

export function getUniversityStatsQ(query: getAllVisionSessionsQuery = {}) {
  return queryOptions({
    queryKey: ["vision", "sessions", query] as const,
    queryFn: async () => {
      const result = await new getAllVisionSessionsBuilder().send({ query });
      return result;
    },
    select: (response) =>
      (response.sessions ?? []).map((session) => ({
        sessionID: session.SessionID,
        moduleID: session.ModuleID,
        eventID: session.EventID ?? null,
        date: session.Date,
        sessionName: session.SessionName,
        sessionDescending: session.SessionDsc ?? null,
        createdBy: session.CreatedBy ?? null,
        createdAt: session.CreatedAt,
        data: session.Data,
      })),
  });
}
