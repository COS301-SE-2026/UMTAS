import { paths } from "@/lib/api";

type getAllEvents = paths["/events"]["get"];
export type getAllEventsQueries = getAllEvents["parameters"]["query"];
export type getAllEventsRes =
  getAllEvents["responses"]["200"]["content"]["application/json"]["events"];

export async function getAllEventsAdmin(
  moduleId: string,
): Promise<getAllEventsRes> {
  const baseUrl =
    (typeof window === "undefined"
      ? process.env.API_URL
      : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:3000";

  const path: keyof paths = "/events";

  const searchParams = new URLSearchParams({ moduleId });

  const queryStr = searchParams.toString();
  const URL = queryStr ? `${baseUrl}${path}?${queryStr}` : baseUrl + path;
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
