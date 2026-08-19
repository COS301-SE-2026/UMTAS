import { api } from "@/components/tanstack/getQueryClient";
import { components, paths } from "@/lib/api";

export type getCoursesV2 = paths["/api/Courses/v2/getAll"]["get"];
export type getCoursesV2Params = getCoursesV2["parameters"]["query"];
export type getCoursesV2Resp =
  getCoursesV2["responses"]["200"]["content"]["application/json"];

export type CourseDtoV2 = components["schemas"]["CourseDto"];

type paramsCoursesV2 =
  | { UniversityID?: string; CourseName?: string; Degree?: string }
  | undefined;

export async function getAllCoursesV2(
  params: getCoursesV2Params,
): Promise<getCoursesV2Resp> {
  return api
    .get("Courses/v2/getAll", {
      searchParams: params as paramsCoursesV2,
    })
    .json<getCoursesV2Resp>();
}
