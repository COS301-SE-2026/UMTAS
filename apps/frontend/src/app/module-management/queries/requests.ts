import { getallEventsReq } from "@/app/builder/utils/events/eventRequestBuilder";
import { paths } from "@/lib/api";

type getAllEvents = paths["/events"]["get"];
export type getAllEventsQueries = getAllEvents["parameters"]["query"];
export type getAllEventsRes =
  getAllEvents["responses"]["200"]["content"]["application/json"];
