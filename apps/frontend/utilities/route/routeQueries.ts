import { queryOptions } from "@tanstack/react-query";
import {
  getActiveRouteBuilder,
  getActiveRouteQuery,
  getRouteQuery,
  getRouterBuilder,
} from "./routeRequestBuilder";

export function getRouteQ(query: getRouteQuery) {
  return queryOptions({
    queryKey: [
      "routes",
      query.originBuildingId,
      query.destinationBuildingId,
    ] as const,
    queryFn: async () => {
      const result = (await new getRouterBuilder().send({ paths: query }))
        .route;

      return result;
    },
  });
}

export function getActiveRouteQ(query: getActiveRouteQuery) {
  return queryOptions({
    queryKey: ["routes", "active", query.date, query.time] as const,
    queryFn: async () => {
      const params = new URLSearchParams({
        date: query.date,
        time: query.time,
      });

      const res = await fetch(`/api/routes/active?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch active route: ${res.statusText}`);
      }

      const result = await res.json();
      return result;
    },
  });
}
