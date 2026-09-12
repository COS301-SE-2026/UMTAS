import { api, getQueryClient } from "@/components/tanstack/getQueryClient";
import { components, paths } from "@/lib/api";
import { RequestBuilder, RequestMethod } from "../request";
import { mutationOptions } from "@tanstack/react-query";

export type getCoursesV2 = paths["/api/Courses/v2/getAll"]["get"];
export type getCoursesV2Params = getCoursesV2["parameters"]["query"];
export type getCoursesV2Resp =
  getCoursesV2["responses"]["200"]["content"]["application/json"];

export type CourseDtoV2 = components["schemas"]["CourseDto"];

type paramsCoursesV2 =
  { UniversityID?: string; CourseName?: string; Degree?: string } | undefined;

export async function getAllCoursesV2(
  params: getCoursesV2Params,
): Promise<getCoursesV2Resp> {
  return api
    .get("Courses/v2/getAll", {
      searchParams: params as paramsCoursesV2,
    })
    .json<getCoursesV2Resp>();
}

export type enrollCourse =
  paths["/api/Courses/course-enrollment/{CourseId}"]["post"];

export type enrollCourseParam = enrollCourse["parameters"]["path"];
export type enrollCourseResp =
  enrollCourse["responses"]["201"]["content"]["application/json"];

export class enrollCourseBuilder extends RequestBuilder<
  enrollCourseParam,
  undefined,
  enrollCourseResp
> {
  constructor() {
    super();
    this.setUrl("/Courses/course-enrollment/{CourseId}").setMethod(
      RequestMethod.POST,
    );
  }
}

export type deleteEnrollmentCourse =
  paths["/api/Courses/course-unenrollment/{CourseId}"]["delete"];

export type deleteEnrollmentCourseParam =
  deleteEnrollmentCourse["parameters"]["path"];

export type deleteEnrollmentCourseResp =
  deleteEnrollmentCourse["responses"]["200"]["content"]["application/json"];

export class delEnrollCourseBuilder extends RequestBuilder<
  deleteEnrollmentCourseParam,
  undefined,
  deleteEnrollmentCourseResp
> {
  constructor() {
    super();
    this.setUrl("/Courses/course-unenrollment/{CourseId}").setMethod(
      RequestMethod.POST,
    );
  }
}

export function enrollUser() {
  return mutationOptions({
    mutationFn: async (paths: enrollCourseParam) => {
      const result = await new enrollCourseBuilder().send({ paths: paths });
      return result;
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["courses"],
      });
    },
  });
}
