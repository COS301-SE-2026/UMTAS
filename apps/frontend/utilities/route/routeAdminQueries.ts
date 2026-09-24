import { mutationOptions } from "@tanstack/react-query";
import { diverRouteBuilder, divertRouteBody } from "./routeAdminRequestBuilder";

export function divertRouteMut() {
  return mutationOptions({
    mutationFn: async (vars: { body: divertRouteBody }) => {
      const result = new diverRouteBuilder().send({ body: vars.body });
      return result;
    },
    onError: (error) => console.error("diversion failed", error),
  });
}
