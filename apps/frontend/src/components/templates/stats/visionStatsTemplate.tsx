"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/baseShadcn/tabs";
import Tutorial from "@/components/organisms/nav/Tutorial";
import VisionFilterBar from "@/components/organisms/stats/visionFilterBar";
import VisionOverview from "@/components/organisms/vision-stats/visionOverview";
import VisionEventComparisonTab from "@/components/organisms/vision-stats/visionEventComparison";
import VisionModule from "@/components/organisms/vision-stats/visionModule";
import VisionSessions from "@/components/organisms/vision-stats/visionSessions";
import VisionInsights from "@/components/organisms/vision-stats/visionInsights";
import { VisionFilters } from "../../../../utilities/vision-stats/VisionTypes";
import {
  getVisionEventsQ,
  getVisionSessionsQ,
} from "../../../../utilities/vision-stats/VisionQueries";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getModuleStatsQ } from "../../../../utilities/stats/statsQueries";

const steps = [
  {
    target: "#stats-tabs",
    content:
      "Switch between Overview, Event, Module, Session and Insight statistics.",
  },
  {
    target: "#stats-content",
    content: "View the statistics and metrics for the selected category here.",
  },
];

export default function VisionStatsPageTemplate() {
  const [filters, setFilters] = useState<VisionFilters>({});
  const [selectedEventId, setSelectedEventId] = useState<string>();

  const {
    data: sessions = [],
    isLoading,
    isError,
  } = useQuery(
    getVisionSessionsQ({
      moduleId: filters.moduleId,
      from: filters.from,
      to: filters.to,
      search: filters.search,
    }),
  );

  const { data: comparisonSessions = [] } = useQuery({
    ...getVisionSessionsQ({ eventId: selectedEventId }),
    enabled: Boolean(selectedEventId),
  });

  const { data: modules = [] } = useQuery(getModuleStatsQ());
  const { data: events = [] } = useQuery(getVisionEventsQ());

  const scopedEvents = events.filter(
    (event) =>
      (!filters.moduleId || event.moduleId === filters.moduleId) &&
      (!filters.eventType || event.activityType === filters.eventType),
  );

  const sessionsToDisplay = filters.eventType
    ? sessions.filter((session) =>
        scopedEvents.some((event) => event.id === session.eventID),
      )
    : sessions;

  return (
    <>
      <Tutorial steps={steps} wait={true} />
      <div className="container mx-auto py-10 space-y-6 px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] pb-2">
            Vision Stats Dashboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            View various statistics and metrics related to the Vision Model.
          </p>
        </div>

        <VisionFilterBar
          modules={modules}
          events={events}
          filters={filters}
          setFilters={setFilters}
          selectedEventId={selectedEventId}
          onEventChange={setSelectedEventId}
        />

        <div>
          <Tabs defaultValue="overview" className="w-full space-y-4">
            <TabsList
              id="stats-tabs"
              className="w-full flex flex-wrap gap-2 h-auto bg-bg-surface"
            >
              <TabsTrigger
                value="overview"
                className="px-4 py-2 cursor-pointer focus-visible:ring-2"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="sessions"
                className="px-4 py-2 cursor-pointer focus-visible:ring-2"
              >
                Sessions
              </TabsTrigger>
              <TabsTrigger
                value="event-comparison"
                className="px-4 py-2 cursor-pointer focus-visible:ring-2"
              >
                Event Comparison
              </TabsTrigger>
              <TabsTrigger
                value="modules"
                className="px-4 py-2 cursor-pointer focus-visible:ring-2"
              >
                Modules
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="px-4 py-2 cursor-pointer focus-visible:ring-2"
              >
                Insights
              </TabsTrigger>
            </TabsList>

            <div id="stats-content">
              <TabsContent value="overview" className="space-y-6">
                <VisionOverview
                  data={sessionsToDisplay}
                  isLoading={isLoading}
                  isError={isError}
                />
              </TabsContent>

              <TabsContent value="sessions">
                <VisionSessions
                  data={sessionsToDisplay}
                  isLoading={isLoading}
                  isError={isError}
                />
              </TabsContent>

              <TabsContent value="event-comparison">
                <VisionEventComparisonTab
                  events={events.filter(
                    (event) =>
                      !filters.moduleId || event.moduleId === filters.moduleId,
                  )}
                  selectedEventId={selectedEventId}
                  filters={filters}
                  data={comparisonSessions}
                  isLoading={isLoading}
                  isError={isError}
                />
              </TabsContent>

              <TabsContent value="modules">
                <VisionModule
                  moduleSelected={Boolean(filters.moduleId)}
                  events={scopedEvents}
                  data={sessionsToDisplay}
                  isLoading={isLoading}
                  isError={isError}
                />
              </TabsContent>

              <TabsContent value="insights">
                <VisionInsights
                  data={sessionsToDisplay}
                  isLoading={isLoading}
                  isError={isError}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
}
