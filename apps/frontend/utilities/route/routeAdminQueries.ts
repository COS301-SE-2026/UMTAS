import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  diverRouteBuilder,
  divertRouteBody,
  getRouteVariantBuilder,
  getRouteVariantQuery,
} from "./routeAdminRequestBuilder";

export function divertRouteMut() {
  return mutationOptions({
    mutationFn: async (vars: { body: divertRouteBody }) => {
      const result = new diverRouteBuilder().send({ body: vars.body });
      return result;
    },
    onError: (error) => console.error("diversion failed", error),
  });
}

export function getRouteVariantQ(query: getRouteVariantQuery) {
  return queryOptions({
    queryKey: [
      "routes",
      "variant",
      query.originBuildingId,
      query.destinationBuildingId,
      query.routeIndex,
    ] as const,
    queryFn: async () => {
      const result = new getRouteVariantBuilder().send({ query });
      return result;
    },
    retry: false,
    enabled: Boolean(query.originBuildingId && query.destinationBuildingId),
  });
}
