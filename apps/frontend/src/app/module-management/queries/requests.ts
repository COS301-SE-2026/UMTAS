import { paths } from "@/lib/api";
import { ApiPath, createUrl } from "../../../../utilities/request";

type getAllEvents = paths["/api/events"]["get"];
export type getAllEventsQueries = getAllEvents["parameters"]["query"];
export type getAllEventsRes =
  getAllEvents["responses"]["200"]["content"]["application/json"]["events"];

export async function getAllEventsAdmin(
  moduleId: string,
): Promise<getAllEventsRes> {
  const path: ApiPath = "/events";

  const searchParams = new URLSearchParams({ moduleId });

  const queryStr = searchParams.toString();
  const URL = queryStr ? `${createUrl(path)}?${queryStr}` : createUrl(path);
  const response = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  } else {
    const data = await response.json();
    return data.events as getAllEventsRes;
  }
}
