import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  addModuleToCourseBody,
  addModuleToCourseBuilder,
  addModuleToCoursePath,
  createCoursesBody,
  createCoursesBuilder,
  deleteCourseBuilder,
  deleteCoursePath,
  fetchAllCoursesBody,
  getAllCoursesBuilder,
  updateCourseBody,
  updateCourseBuilder,
  updateCoursePath,
} from "./courseBuilder";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { getAllModCoursesQ } from "../modules/moduleQueries";

export function getAllCoursesQ(body?: fetchAllCoursesBody) {
  return queryOptions({
    queryKey: ["courses", body],
    queryFn: async () => {
      const builder = new getAllCoursesBuilder();
      const result = await builder.send({ body: body });
      return result.courses;
    },
  });
}

export function createCourseQ() {
  return mutationOptions({
    mutationFn: async (body: createCoursesBody) => {
      return new createCoursesBuilder().send({ body: body });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllCoursesQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}

export function updateCourseQ() {
  return mutationOptions({
    mutationFn: async (vars: {
      body: updateCourseBody;
      path: updateCoursePath;
    }) => {
      return new updateCourseBuilder().send({
        body: vars.body,
        paths: vars.path,
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllCoursesQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}

export function deleteCourseQ(path: deleteCoursePath) {
  return mutationOptions({
    mutationFn: async () => {
      return new deleteCourseBuilder().send({ paths: path });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllCoursesQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}

export function addModuleToCourseQ() {
  return mutationOptions({
    mutationFn: async (vars: {
      path: addModuleToCoursePath;
      body: addModuleToCourseBody;
    }) => {
      return new addModuleToCourseBuilder().send({
        paths: vars.path,
        body: vars.body,
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllCoursesQ().queryKey,
      });
      getQueryClient().invalidateQueries({
        queryKey: getAllModCoursesQ().queryKey,
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });
}
