import { environmentManager, QueryClient } from "@tanstack/react-query";
import ky from "ky";
import { createBaseURL } from "../../../utilities/request";

export const api = ky.create({
  prefix: createBaseURL(),
  timeout: 10000,
  credentials: "include",
});

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
