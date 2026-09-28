"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/baseShadcn/tabs";

import EventManagementTemplate from "./eventManagementTemplate";
import ModManagementTemplate from "./moduleManagementTemplate";

const headings = {
  events: {
    title: "Event Management",
    description: "Search and filter events and their modules.",
  },
  modules: {
    title: "Module Management",
    description: "Search and filter modules and their events.",
  },
};

export default function ModuleEventTemplateTabs() {
  const [activeTab, setActiveTab] = useState<keyof typeof headings>("events");

  return (
    <div className="w-full">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as keyof typeof headings)}
        className="w-full"
      >
        <div className="flex w-full flex-col items-center gap-6 px-6 pt-4">
          <div className="w-full max-w-6xl pt-4">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              {headings[activeTab].title}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {headings[activeTab].description}
            </p>
          </div>

          <div className="w-full max-w-6xl">
            <TabsList id="management-tabs" className="flex h-auto gap-2">
              <TabsTrigger
                value="events"
                className="cursor-pointer px-4 py-2 focus-visible:ring-2"
              >
                Events
              </TabsTrigger>

              <TabsTrigger
                value="modules"
                className="cursor-pointer px-4 py-2 focus-visible:ring-2"
              >
                Modules
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div id="tabs-content" className="w-full">
          <TabsContent value="events" className="mt-0">
            <EventManagementTemplate />
          </TabsContent>

          <TabsContent value="modules" className="mt-0">
            <ModManagementTemplate />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
