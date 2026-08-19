import { paths } from "@/lib/api";

import { api } from "@/components/tanstack/getQueryClient";

export type getAllModulesV2 = paths["/api/modules/v2"]["get"];

export type getAllModulesV2Params = getAllModulesV2["parameters"]["query"];
export type getAllModulesV2Resp =
  getAllModulesV2["responses"]["200"]["content"]["application/json"];

export function fetchAllModulesv2(
  params: getAllModulesV2Params,
): Promise<getAllModulesV2Resp> {
  const result = api
    .get("modules/v2", {
      searchParams: params,
    })
    .json<getAllModulesV2Resp>();

  console.log(result);
  return result;
}
