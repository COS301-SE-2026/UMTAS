import { paths } from "@/lib/api";
import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

export type createCourses = paths["/Courses"]["post"];

export type createCoursesBody =
  createCourses["requestBody"]["content"]["application/json"];
export type createCoursesRes = createCourses["responses"]["201"];

export class createCoursesBuilder extends RequestBuilder<
  undefined,
  createCoursesBody,
  createCoursesRes
> {
  constructor() {
    super();
    this.setUrl("/Courses").setMethod(RequestMethod.POST);
  }
}
export type fetchAllCourses =
  paths["/Courses/university/{universityId}"]["get"];
export type fetchAllCoursesQueries = fetchAllCourses["parameters"]["query"];
export type fetchAllCourseRes =
  fetchAllCourses["responses"]["200"]["content"]["application/json"];

export async function fetchAllCoursesRequest(queries: fetchAllCoursesQueries) {
  const baseUrl =
    (typeof window === "undefined"
      ? process.env.API_URL
      : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:3000";

  const searchParams = new URLSearchParams();
  if (queries?.UniversityID) {
    searchParams.append("UniversityID", queries.UniversityID);
  }
  if (queries?.Degree) {
    searchParams.append("Degree", queries.Degree);
  }
  const queryStr = searchParams.toString();
  const URL = queryStr ? `${baseUrl}?${queryStr}` : baseUrl;

  const response = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  } else {
    const data = await response.json();
    return data as fetchAllCourseRes;
  }
}
