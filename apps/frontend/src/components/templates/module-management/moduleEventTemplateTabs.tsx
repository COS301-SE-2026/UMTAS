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
    <>
      <div className="flex flex-col items-center w-full pt-2 px-6">
        <div className="w-full max-w-6xl px-4 md:px-0">
          <Tabs defaultValue="events" className="">
            <TabsList id="management-tabs" className="flex gap-2 h-auto">
              <TabsTrigger
                value="events"
                className="px-4 py-2 cursor-pointer focus-visible:ring-2"
              >
                Events
              </TabsTrigger>
              <TabsTrigger
                value="modules"
                className="px-4 py-2 cursor-pointer focus-visible:ring-2"
              >
                Modules
              </TabsTrigger>
            </TabsList>

            <div id="tabs-content">
              <TabsContent value="events">
                <EventManagementTemplate />
              </TabsContent>
              <TabsContent value="modules">
                <ModManagementTemplate />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
}
