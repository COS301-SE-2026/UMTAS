import { components, paths } from "@/lib/api";
import {
  RequestBuilder,
  RequestMethod,
} from "../../../../../utilities/request";

export type CourseDTO = components["schemas"]["CourseDto"];

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
export type fetchAllCourses = paths["/Courses/All"]["post"];
export type fetchAllCoursesBody =
  fetchAllCourses["requestBody"]["content"]["application/json"];
export type fetchAllCoursesRes =
  fetchAllCourses["responses"]["200"]["content"]["application/json"];

export class getAllCoursesBuilder extends RequestBuilder<
  undefined,
  fetchAllCoursesBody,
  fetchAllCoursesRes
> {
  constructor() {
    super();
    this.setUrl("/Courses/All").setMethod(RequestMethod.POST);
  }
}

export type updateCourse = paths["/Courses/{CourseId}"]["patch"];
export type updateCoursePath = updateCourse["parameters"]["path"];
export type updateCourseBody =
  updateCourse["requestBody"]["content"]["application/json"];
export type updateCourseRes =
  updateCourse["responses"]["200"]["content"]["application/json"];

export class updateCourseBuilder extends RequestBuilder<
  updateCoursePath,
  updateCourseBody,
  updateCourseRes
> {
  constructor() {
    super();
    this.setUrl("/Courses/{CourseId}").setMethod(RequestMethod.PATCH);
  }
}

export type deleteCourse = paths["/Courses/{CourseId}"]["delete"];
export type deleteCoursePath = deleteCourse["parameters"]["path"];
export type deleteCourseRes = deleteCourse["responses"]["200"];
export class deleteCourseBuilder extends RequestBuilder<
  deleteCoursePath,
  undefined,
  deleteCourseRes
> {
  constructor() {
    super();
    this.setUrl("/Courses/{CourseId}").setMethod(RequestMethod.DELETE);
  }
}

export type addModuleToCourse = paths["/modules/{CourseID}"]["put"];
export type addModuleToCoursePath = addModuleToCourse["parameters"]["path"];
export type addModuleToCourseBody =
  addModuleToCourse["requestBody"]["content"]["application/json"];
export type addModuleToCourseRes =
  addModuleToCourse["responses"]["200"]["content"]["application/json"];

export class addModuleToCourseBuilder extends RequestBuilder<
  addModuleToCoursePath,
  addModuleToCourseBody,
  addModuleToCourseRes
> {
  constructor() {
    super();
    this.setUrl("/modules/{CourseID}").setMethod(RequestMethod.PUT);
  }
}
