import { queryOptions } from "@tanstack/react-query";
import { getRouteQuery, getRouterBuilder } from "./routeRequestBuilder";

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
