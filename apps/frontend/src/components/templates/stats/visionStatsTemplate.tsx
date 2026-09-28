"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/baseShadcn/tabs";
import Tutorial from "@/components/organisms/nav/Tutorial";

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
  return (
    <>
      <Tutorial steps={steps} wait={true} />
      <div className="container mx-auto py-10 space-y-6 px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] pb-2">
            Vision Stats Dashboard
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
                value="overview"
                className="px-4 py-2 cursor-pointer focus-visible:ring-2"
              >
                Overview
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
                value="sessions"
                className="px-4 py-2 cursor-pointer focus-visible:ring-2"
              >
                Sessions
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
                hier
              </TabsContent>
              <TabsContent value="event-comparison">hier</TabsContent>

              <TabsContent value="modules">hier</TabsContent>

              <TabsContent value="sessions">hier</TabsContent>

              <TabsContent value="insights">hier</TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
}
