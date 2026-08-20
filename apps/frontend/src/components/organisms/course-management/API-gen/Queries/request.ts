import { api } from "@/components/tanstack/getQueryClient";
import { paths } from "@/lib/api";

type APIServiceCourses = paths["/api/api-service/courses"]["get"];

type APIServiceCoursesParam = APIServiceCourses["parameters"]["query"];
type APIServiceCoursesResp =
  APIServiceCourses["responses"]["200"]["content"]["application/json"];

export async function fetchAPIserviceCourses(params: APIServiceCoursesParam) {
  const result = api
    .get("api/api-service/courses", {
      searchParams: params,
    })
    .json<APIServiceCoursesResp>();

  return (await result).courses;
}
