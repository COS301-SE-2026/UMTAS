import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  assignVenueBody,
  assignVenueBuilder,
  assignVenuePath,
  bulkAssignVenueBody,
  bulkAssignVenueBuilder,
  getAllVenuesBuilder,
  getAllVenuesQuery,
} from "./venueRequestBuilder";

export function getAllVenuesQ(query?: getAllVenuesQuery) {
  return queryOptions({
    queryKey: ["venues", query] as const,
    queryFn: async () => {
      const result = (await new getAllVenuesBuilder().send({ paths: query }))
        .venues;
      console.log(result, "Sent venues ");
      return result;
    },
  });
}

export function assignVenueMut() {
  return mutationOptions({
    mutationFn: async (vars: {
      body: assignVenueBody;
      path: assignVenuePath;
    }) => {
      console.log(vars.body);
      const result = new assignVenueBuilder().send({
        body: vars.body,
        paths: vars.path,
      });
      console.log("result", await result);
      return result;
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllVenuesQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}

export function bulkAssignVenueMut() {
  return mutationOptions({
    mutationFn: async (vars: { body: bulkAssignVenueBody }) => {
      console.log(vars.body);
      const result = new bulkAssignVenueBuilder().send({
        body: vars.body,
      });
      console.log("result", await result);
      return result;
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllVenuesQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}
