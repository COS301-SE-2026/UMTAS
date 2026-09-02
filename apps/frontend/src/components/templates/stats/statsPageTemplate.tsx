"use client";

import UniversityStats, {
  UniversityStatsData,
} from "@/components/organisms/stats/universityTab";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/baseShadcn/tabs";
import CoursesTab, {
  CourseData,
} from "@/components/organisms/stats/coursesTab";
import EventsTab, {
  VenueStatsData,
  WeekStatsData,
} from "@/components/organisms/stats/eventsTab";
import ModulesTab, {
  ModuleData,
} from "@/components/organisms/stats/modulesTab";
import { useQuery } from "@tanstack/react-query";
import {
  getCourseStatsQ,
  getEventStatsVenueQ,
  getEventStatsWeekQ,
  getModuleStatsQ,
  getUniversityStatsQ,
} from "../../../../utilities/stats/statsQueries";

// const mockUniversityStats: UniversityStatsData = {
//   countCourses: 100,
//   countEvents: 67,
//   countModule: 420,
//   numberOfStudents: 69690,
// };

// const mockCourseData: CourseData[] = [
//   {
//     id: "1",
//     name: "Computer Science",
//     countModules: 10,
//     countEvents: 30,
//     numberOfStudents: 67,
//   },
//   {
//     id: "2",
//     name: "Mathematics",
//     countModules: 12,
//     countEvents: 22,
//     numberOfStudents: 152,
//   },
// ];

// const mockWeekStats: WeekStatsData[] = [
//   { day: "Mon", count: 12 },
//   { day: "Tue", count: 8 },
//   { day: "Wed", count: 15 },
//   { day: "Thu", count: 10 },
//   { day: "Fri", count: 6 },
// ];

// const mockVenueStats: VenueStatsData[] = [
//   { venue: "Louw Hal", eventCount: 13, predictedAttendance: 100 },
//   { venue: "Thuto 1-1", eventCount: 9, predictedAttendance: 150 },
// ];

// const mockModules: ModuleData[] = [
//   { id: "1", name: "COS 330", countEvents: 9, numberOfStudents: 112 },
//   { id: "2", name: "COS 332", countEvents: 4, numberOfStudents: 99 },
// ];

export default function StatsPageTemplate() {
  const {
    data: universityStats,
    isLoading: isUniversityLoading,
    isError: isUniversityError,
  } = useQuery(getUniversityStatsQ());

  const {
    data: courseStats,
    isLoading: isCourseLoading,
    isError: isCourseError,
  } = useQuery(getCourseStatsQ());

  const {
    data: moduleStats,
    isLoading: isModuleLoading,
    isError: isModuleError,
  } = useQuery(getModuleStatsQ());

  const {
    data: weekStats,
    isLoading: isWeekLoading,
    isError: isWeekError,
  } = useQuery(getEventStatsWeekQ());

  const {
    data: venueStats,
    isLoading: isVenueLoading,
    isError: isVenueError,
  } = useQuery(getEventStatsVenueQ());

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] pb-2">
          Stats Dashboard
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          View various statistics and metrics related to the UMTAS system.
        </p>
      </div>

      <div>
        <Tabs defaultValue="university" className="w-full space-y-4">
          <TabsList className="w-full flex flex-wrap gap-2 h-auto p-2">
            <TabsTrigger value="university" className="px-4 py-2">
              University
            </TabsTrigger>
            <TabsTrigger value="courses" className="px-4 py-2">
              Courses
            </TabsTrigger>
            <TabsTrigger value="modules" className="px-4 py-2">
              Modules
            </TabsTrigger>
            <TabsTrigger value="events" className="px-4 py-2">
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="university" className="space-y-6">
            <UniversityStats
              data={universityStats}
              isLoading={isUniversityLoading}
              isError={isUniversityError}
            />
          </TabsContent>

          <TabsContent value="courses">
            <CoursesTab
              data={courseStats}
              isLoading={isCourseLoading}
              isError={isCourseError}
            />
          </TabsContent>

          <TabsContent value="modules">
            <ModulesTab
              data={moduleStats}
              isLoading={isModuleLoading}
              isError={isModuleError}
            />
          </TabsContent>

          <TabsContent value="events">
            <EventsTab
              weekData={weekStats}
              isLoadingWeek={isWeekLoading}
              isErrorWeek={isWeekError}
              venueData={venueStats}
              isLoadingVenue={isVenueLoading}
              isErrorVenue={isVenueError}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
