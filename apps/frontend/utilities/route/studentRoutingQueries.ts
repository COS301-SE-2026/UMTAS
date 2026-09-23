import { queryOptions } from "@tanstack/react-query";
import { getStudentRoutesQuery } from "./routeRequestBuilder";
import {
  getAlternateRoutesBuilder,
  getAlternateRoutesQuery,
  getStudentRoutesBuilder,
} from "./studentRoutingRequestBuilder";

//this already exist, but this one is more correct and i am scared to break my integration (also lazy)
export function getStudentRoutesQ(query: getStudentRoutesQuery) {
  return queryOptions({
    queryKey: ["routes", "students", query.date] as const,
    queryFn: async () => {
      const result = new getStudentRoutesBuilder().send({ query });
      return result;
    },
  });
}

export function getAlternateRoutesQ(query: getAlternateRoutesQuery) {
  return queryOptions({
    queryKey: [
      "routes",
      "students",
      "alternatives",
      query.date,
      query.destinationEventId,
      query.originEventId,
      query.routeIndex,
    ] as const,
    queryFn: async () => {
      const result = new getAlternateRoutesBuilder().send({ query });
      return result;
    },
    enabled: query.routeIndex !== undefined,
  });
}
