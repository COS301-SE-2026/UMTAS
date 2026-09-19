"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/baseShadcn/tabs";

import EventManagementTemplate from "./eventManagementTemplate";
import ModManagementTemplate from "./moduleManagementTemplate";

export default function ModuleEventTemplateTabs() {
  return (
    <div className="w-full pt-2">
      <Tabs defaultValue="events" className="w-full">
        <div className="flex w-full justify-center px-6">
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
