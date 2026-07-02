import React from "react";
import HeatMapTemplate from "@/components/templates/stats/heatMapTemplate";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/baseShadcn/tabs";

export default async function statsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-lg font-semibold text-[var(--text-primary)]">
        Stats Dashboard
      </h1>
      <p className="text-sm text-[var(--text-secondary)]">
        View various statistics and metrics related to the Umtas system,
        including heatmaps, charts, and other visual representations of data.
      </p>

      <div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full flex flex-wrap gap-2">
            <TabsTrigger value="overview" className="px-4 py-2">
              Overview
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="px-4 py-2">
              Scheduling & Clashes
            </TabsTrigger>
            <TabsTrigger value="faculty" className="px-4 py-2">
              Faculty Metrics
            </TabsTrigger>
            <TabsTrigger value="campus" className="px-4 py-2">
              Campus Utilisation
            </TabsTrigger>
            <TabsTrigger value="enrollment" className="px-4 py-2">
              Student Enrollment
            </TabsTrigger>
            <TabsTrigger value="resources" className="px-4 py-2">
              Resource Allocation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              <HeatMapTemplate />
              <HeatMapTemplate />
              <HeatMapTemplate />
              <HeatMapTemplate />
            </div>
          </TabsContent>

          <TabsContent value="scheduling">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              <HeatMapTemplate />
              <HeatMapTemplate />
            </div>
          </TabsContent>

          <TabsContent value="faculty">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              <HeatMapTemplate />
            </div>

            <HeatMapTemplate />
          </TabsContent>

          <TabsContent value="campus">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              <HeatMapTemplate />

              <HeatMapTemplate />

              <HeatMapTemplate />
            </div>
          </TabsContent>

          <TabsContent value="enrollment">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              <HeatMapTemplate />
            </div>
          </TabsContent>

          <TabsContent value="resources">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              <HeatMapTemplate />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
