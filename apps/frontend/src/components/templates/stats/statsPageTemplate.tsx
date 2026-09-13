"use client";

import UniversityStats from "@/components/organisms/stats/universityTab";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/baseShadcn/tabs";
import CoursesTab from "@/components/organisms/stats/coursesTab";
import EventsTab from "@/components/organisms/stats/eventsTab";
import ModulesTab from "@/components/organisms/stats/modulesTab";
import Tutorial from "@/components/organisms/nav/Tutorial";

import { useQuery } from "@tanstack/react-query";
import {
  getCourseStatsQ,
  getEventStatsVenueQ,
  getEventStatsWeekQ,
  getModuleStatsQ,
  getUniversityStatsQ,
} from "../../../../utilities/stats/statsQueries";

const steps = [
  {
    target: "#stats-tabs",
    content: "Switch between University, Course, Module, and Event statistics.",
  },
  {
    target: "#stats-content",
    content: "View the statistics and metrics for the selected category here.",
  },
];

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
    <>
      <Tutorial steps={steps} wait={true} />
      <div className="container mx-auto py-10 space-y-6 px-8">
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
            <TabsList
              id="stats-tabs"
              className="w-full flex flex-wrap gap-2 h-auto"
            >
              <TabsTrigger
                value="university"
                className="px-4 py-2 cursor-pointer focus-visible:ring-2"
              >
                University
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                className="px-4 py-2 cursor-pointer focus-visible:ring-2"
              >
                Courses
              </TabsTrigger>
              <TabsTrigger
                value="modules"
                className="px-4 py-2 cursor-pointer focus-visible:ring-2"
              >
                Modules
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className="px-4 py-2 cursor-pointer focus-visible:ring-2"
              >
                Events
              </TabsTrigger>
            </TabsList>

            <div id="stats-content">
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
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
}
