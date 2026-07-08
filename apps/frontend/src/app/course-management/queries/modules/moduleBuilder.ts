import { components, paths } from "@/lib/api";

export type moduleDTO = components["schemas"]["ModuleSingleResponseDto"];
export type getAllModules = paths["/modules"]["get"];

export type getAllModulesQueries = getAllModules["parameters"]["query"];
export type getAllModulesRes =
  getAllModules["responses"]["200"]["content"]["application/json"]["modules"];

export async function fetchAllModules(queries: getAllModulesQueries) {
  const baseUrl =
    (typeof window === "undefined"
      ? process.env.API_URL
      : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:3000";

  const path: keyof paths = "/modules";

  const searchParams = new URLSearchParams();

  if (queries?.GroupID) {
    searchParams.append("GroupID" as keyof typeof queries, queries.GroupID);
  }
  if (queries?.courseId) {
    searchParams.append("courseId" as keyof typeof queries, queries.courseId);
  }
  if (queries?.universityId) {
    searchParams.append(
      "universityId" as keyof typeof queries,
      queries.universityId,
    );
  }
  if (queries?.moduleCode) {
    searchParams.append(
      "moduleCode" as keyof typeof queries,
      queries.moduleCode,
    );
  }
  if (queries?.userEnrollment) {
    searchParams.append(
      "userEnrollment" as keyof typeof queries,
      String(queries.userEnrollment), // bool
    );
  }

  const queryStr = searchParams.toString();
  const URL = queryStr ? `${baseUrl}${path}?${queryStr}` : baseUrl + path;

  const response = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  console.log(response);
  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  } else {
    const data = await response.json();
    return data.modules as getAllModulesRes;
  }
}
