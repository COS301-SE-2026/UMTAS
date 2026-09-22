import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { getQueryClient } from "@/components/tanstack/getQueryClient";

import type { paths } from "@/lib/api";

import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

type AssignMeEndpoint = paths["/api/teaches/me/modules"]["post"];

type AssignMeBody =
  AssignMeEndpoint["requestBody"]["content"]["application/json"];

type AssignMeResponse =
  AssignMeEndpoint["responses"]["201"]["content"]["application/json"];

type GetMyTaughtModulesEndpoint = paths["/api/teaches/me/modules"]["get"];
type GetMyTaughtModulesResponse =
  GetMyTaughtModulesEndpoint["responses"]["200"]["content"]["application/json"];

export class GetMyTaughtModules extends RequestBuilder<
  undefined,
  undefined,
  GetMyTaughtModulesResponse
> {
  constructor() {
    super();
    this.setUrl("/teaches/me/modules").setMethod(RequestMethod.GET);
  }
}

export function getMyTaughtModulesQ() {
  return queryOptions({
    queryKey: ["teaches", "me"] as const,
    queryFn: () => new GetMyTaughtModules().send({}),
  });
}

class AssignMeToModule extends RequestBuilder<
  undefined,
  AssignMeBody,
  AssignMeResponse
> {
  constructor() {
    super();

    this.setUrl("/teaches/me/modules").setMethod(RequestMethod.POST);
  }
}

export function assignMeToModuleMut() {
  return mutationOptions({
    mutationFn: async (moduleID: string) => {
      return new AssignMeToModule().send({
        body: {
          ModuleID: moduleID,
        },
      });
    },
    onSuccess: async () => {
      await Promise.all([
        getQueryClient().invalidateQueries({
          queryKey: getMyTaughtModulesQ().queryKey,
        }),
        getQueryClient().invalidateQueries({ queryKey: ["Modules"] }),
      ]);
    },
  });
}
