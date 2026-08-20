import { api } from "@/components/tanstack/getQueryClient";
import { components, paths } from "@/lib/api";

type APIServiceCourses = paths["/api/api-service/courses"]["get"];

type APIServiceCoursesParam = APIServiceCourses["parameters"]["query"];
export type APIServiceCoursesResp =
  APIServiceCourses["responses"]["200"]["content"]["application/json"];

export async function fetchAPIserviceCourses(params: APIServiceCoursesParam) {
  const result = api
    .get("api-service/courses", {
      searchParams: params,
    })
    .json<APIServiceCoursesResp>();

  return (await result).courses;
}

type APIserviceModules = paths["/api/api-service/modules"]["get"];

type APIserviceModulesParams = APIserviceModules["parameters"]["query"];

export type APIserviceModulesResp =
  APIserviceModules["responses"]["200"]["content"]["application/json"];

export type moduleResponseType =
  components["schemas"]["ModuleSingleResponseDto"];

export async function fetchAPIserviceModules(
  params: APIserviceModulesParams,
): Promise<APIserviceModulesResp> {
  console.log("Ran the fetch api service modules");
  if (params.courseId == "") return { modules: [], message: "" };
  const result = api
    .get("api-service/modules", {
      searchParams: params,
    })
    .json<APIserviceModulesResp>();

  return await result;
}

export async function fetchAllModules(
  courses: APIServiceCoursesResp["courses"],
): Promise<APIserviceModulesResp["modules"]> {
  console.log(courses);
  const requests = courses.map((course) => {
    console.log(course);
    return fetchAPIserviceModules({ courseId: course.CourseID ?? "" });
  });

  const results = await Promise.all(requests);
  return results.flatMap((res) => res.modules ?? []);
}

type APIserviceEvents = paths["/api/api-service/events"]["get"];
type APIserviceEventsParams = APIserviceEvents["parameters"]["query"];
type APIserviceEventsResp =
  APIserviceEvents["responses"]["200"]["content"]["application/json"];

export async function fetchAPIserviceEvents(params: APIserviceEventsParams) {
  if (params.moduleId == "") return [];
  const result = api
    .get("api-service/events", {
      searchParams: params,
    })
    .json<APIserviceEventsResp>();

  return await result;
}

export async function fetchAllEvents(
  modules: APIserviceModulesResp["modules"],
) {
  const requests = modules.map((module) =>
    fetchAPIserviceEvents({ moduleId: module.ExternalID ?? "" }),
  );
  const results = await Promise.all(requests);

  return results.flat;
}
