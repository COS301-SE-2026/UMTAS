import { paths } from "@/lib/api";
import { getCoursesV2Params } from "./Courses";
import { api } from "@/components/tanstack/getQueryClient";

export type getAllModulesV2 = paths["/api/modules/v2"]["get"];

export type getAllModulesV2Params = getAllModulesV2["parameters"]["query"];
export type getAllModulesV2Resp =
  getAllModulesV2["responses"]["200"]["content"]["application/json"];

export function fetchAllModulesv2(
  params: getCoursesV2Params,
): Promise<getAllModulesV2Resp> {
  return api
    .get("modules/v2", {
      searchParams: params as getAllModulesV2Params,
    })
    .json<getAllModulesV2Resp>();
}
