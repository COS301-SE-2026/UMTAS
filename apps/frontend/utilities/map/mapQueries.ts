import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  getMapConfigBuilder,
  updateMapConfigBuilder,
  updateMapConfigBody,
  updateMapConfigPath,
} from "./map-configRequestBuilder";

export function getMapConfigQ() {
  return queryOptions({
    queryKey: ["map-config"] as const,
    queryFn: async () => {
      const result = await new getMapConfigBuilder().send({});
      console.log(result, "Sent map config ");
      return result;
    },
    staleTime: Infinity,
    //24 hour TTL for caching
    gcTime: 1000 * 60 * 60 * 24,
  });
}

export function updateMapConfigQ() {
  return mutationOptions({
    mutationFn: async (vars: {
      body: updateMapConfigBody;
      path: updateMapConfigPath;
    }) => {
      console.log(vars.body);
      const result = new updateMapConfigBuilder().send({
        body: vars.body,
        paths: vars.path,
      });
      console.log("result", await result);
      return result;
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getMapConfigQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}
