import { queryOptions } from "@tanstack/react-query";
import {
  getAllEventsBuilder,
  getAllEventsQuery,
  getAllVisionSessionsBuilder,
  getAllVisionSessionsQuery,
} from "./VisionRequestBuilder";

export function getVisionSessionsQ(query: getAllVisionSessionsQuery = {}) {
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

export function getVisionEventsQ(query: getAllEventsQuery = {}) {
  return queryOptions({
    queryKey: ["vision", "events", query] as const,
    queryFn: async () => new getAllEventsBuilder().send({ query }),
    select: (response) =>
      (response.events ?? []).map((event) => ({
        id: event.eventId,
        moduleId: event.eventCriteria?.moduleId ?? null,
        name: event.eventName ?? event.activityCode ?? "Unnamed event",
        activityType: event.activityType ?? "other",
      })),
  });
}
