import { components, paths } from "@/lib/api";

import { api } from "@/components/tanstack/getQueryClient";

export type getAllTimetablesV2 = paths["/api/timetables/v2"]["get"];

export type getAllTimetablesV2Response =
  getAllTimetablesV2["responses"]["200"]["content"]["application/json"];

export function fetchAllTimetablesv2(): Promise<getAllTimetablesV2Response> {
  const result = api.get("timetables/v2").json<getAllTimetablesV2Response>();
  return result;
}

export type TTdto =
  components["schemas"]["TimetableListResponseDtoV2"]["timetables"];
