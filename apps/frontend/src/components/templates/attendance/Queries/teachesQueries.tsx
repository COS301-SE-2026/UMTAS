import { mutationOptions } from "@tanstack/react-query";

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
  });
}
