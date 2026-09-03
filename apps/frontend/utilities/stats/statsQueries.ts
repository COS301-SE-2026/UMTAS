import { queryOptions } from "@tanstack/react-query";
import {
  getUniversityStatsBuilder,
  getCourseStatsBuilder,
  getModuleStatsBuilder,
  getEventStatsWeekBuilder,
  getEventStatsVenueBuilder,
} from "./statsRequestBuilder";

export function getUniversityStatsQ() {
  return queryOptions({
    queryKey: ["stats", "university"] as const,
    queryFn: async () => {
      const result = await new getUniversityStatsBuilder().send({});
      return result;
    },
    select: (response) => ({
      countCourses: response.CourseCount,
      countModule: response.ModuleCount,
      countEvents: response.EventCount,
      numberOfStudents: response.EnrolledStudents,
    }),
  });
}

export function getCourseStatsQ() {
  return queryOptions({
    queryKey: ["stats", "courses"] as const,
    queryFn: async () => {
      const result = await new getCourseStatsBuilder().send({});
      return result;
    },
    select: (response) =>
      response.data.map((course) => ({
        id: course.CourseID,
        name: course.CourseName ?? "Unknown Course",
        countModules: course.ModuleCount,
        countEvents: course.EventCount,
        numberOfStudents: course.EnrolledStudents,
      })),
  });
}

export function getModuleStatsQ() {
  return queryOptions({
    queryKey: ["stats", "modules"] as const,
    queryFn: async () => {
      const result = await new getModuleStatsBuilder().send({});
      return result;
    },
    select: (response) =>
      response.data.map((module) => ({
        id: module.ModuleID,
        name: module.ModuleCode ?? "Unknown Module",
        countEvents: module.EventCount,
        numberOfStudents: module.EnrolledStudents,
      })),
  });
}

export function getEventStatsWeekQ() {
  return queryOptions({
    queryKey: ["stats", "events", "week"] as const,
    queryFn: async () => {
      const result = await new getEventStatsWeekBuilder().send({});
      return result;
    },
    select: (response) =>
      response.data.map((dayData) => ({
        day: dayData.dayOfWeek,
        count: dayData.EventCount,
      })),
  });
}

export function getEventStatsVenueQ() {
  return queryOptions({
    queryKey: ["stats", "events", "venue"] as const,
    queryFn: async () => {
      const result = await new getEventStatsVenueBuilder().send({});
      return result;
    },
    select: (response) =>
      response.data.map((venueData) => ({
        venue: venueData.VenueName,
        eventCount: venueData.EventCount,
        predictedAttendance: venueData.ProjectedAttendance,
      })),
  });
}
