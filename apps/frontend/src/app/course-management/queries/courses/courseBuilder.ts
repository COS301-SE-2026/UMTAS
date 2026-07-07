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
