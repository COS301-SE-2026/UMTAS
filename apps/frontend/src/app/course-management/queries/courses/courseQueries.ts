import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  createCoursesBody,
  createCoursesBuilder,
  deleteCourseBuilder,
  deleteCoursePath,
  fetchAllCoursePath,
  fetchAllCoursesQueries,
  fetchAllCoursesRequest,
  updateCourseBody,
  updateCourseBuilder,
  updateCoursePath,
} from "./courseBuilder";
import { getQueryClient } from "@/components/tanstack/getQueryClient";

export function getAllCoursesQ(
  path?: fetchAllCoursePath,
  queries?: fetchAllCoursesQueries,
) {
  return queryOptions({
    queryKey: ["courses"],
    queryFn: async () => {
      const result = await fetchAllCoursesRequest(path, queries);
      return result;
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
