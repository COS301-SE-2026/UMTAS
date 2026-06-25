"use client";
import { Card } from "@/components/atoms/baseShadcn/card";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { EventCard } from "@/components/molecules/builder/EventCard";
import { ModuleCard } from "@/components/molecules/builder/ModuleCard";
import { Button } from "@/components/atoms/baseShadcn/button";
import CustomiseEventPanel from "@/components/atoms/customise/CustomiseEventPanel";
import CustomiseModulePanel from "@/components/atoms/customise/CustomiseModulePanel";
import { CustomiseModuleCard } from "@/components/molecules/customise/CustomiseModuleCard";
import { CustomiseEventCard } from "@/components/molecules/customise/CustomiseEventCard";

//some mock data for the static pages
export const mockModules: ModuleResponseDto[] = [
  {
    moduleID: 1,
    userID: "yum1",
    moduleCode: "COS301",
    moduleName: "Software Eng",
    styling: "#0062ff",
  },
  {
    moduleID: 2,
    userID: "yum2",
    moduleCode: "COS332",
    moduleName: "Computer Networks",
    styling: "#00ffaa",
  },
  {
    moduleID: 3,
    userID: "yum3",
    moduleCode: "COS333",
    moduleName:
      "Memorise this work my dear student, then I will test you on something else",
    styling: "#ffa200",
  },
];

export const mockEvents: EventResponse[] = [
  {
    event: {
      eventID: 1,
      userID: "yum1",
      name: "COS301 Lecture 1",
      code: "301-L1",
      eventCriteria: {
        day: "Monday",
        startTime: "08:30",
        endTime: "10:00",
        type: "lecture",
        moduleCode: "COS301",
      },
    },
    lecture: {
      lectureID: 1,
      eventID: 1,
      moduleID: 1,
    },
  },
  {
    event: {
      eventID: 2,
      userID: "yum2",
      name: "Computer Networks Lecture",
      code: "333-L1",
      eventCriteria: {
        day: "Wednesday",
        startTime: "14:30",
        endTime: "17:30",
        type: "lecture",
        moduleCode: "COS333",
      },
    },
    lecture: {
      lectureID: 2,
      eventID: 2,
      moduleID: 2,
    },
  },
  {
    event: {
      eventID: 3,
      userID: "yum3",
      name: "Fail noob",
      code: "333-L1",
      eventCriteria: {
        day: "Friday",
        startTime: "11:30",
        endTime: "13:00",
        type: "lecture",
        moduleCode: "COS333",
      },
    },
    lecture: {
      lectureID: 3,
      eventID: 3,
      moduleID: 3,
    },
  },
];

export default function Customise() {
  return (
    <div className="flex flex-row flex-wrap items-start">
      <Card className="w-fit m-6 p-4">
        <div className="flex flex-row gap-6">
          <div className="flex flex-col gap-2 min-w-[240px]">
            <div className="flex gap-1 bg-muted p-1 rounded-md mb-1">
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs flex-1 font-semibold"
              >
                Modules
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs flex-1 text-muted-foreground"
              >
                Events
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <CustomiseModulePanel module={mockModules[0]} />
              <CustomiseModulePanel module={mockModules[1]} />
              <CustomiseModulePanel module={mockModules[2]} />
            </div>
          </div>

          <div className="w-[1px] bg-border self-stretch" />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b min-w-[320px]">
              <span className="text-sm font-semibold">
                {mockModules[0].moduleName} |{" "}
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {mockModules[0].moduleCode}
                </span>
              </span>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 px-3 text-xs"
                >
                  Discard
                </Button>
              </div>
            </div>

            <CustomiseModuleCard module={mockModules[0]} onUpdate={() => {}} />
          </div>
        </div>
      </Card>

      <Card className="w-fit m-6 p-4">
        <div className="flex flex-row gap-6">
          <div className="flex flex-col gap-2 min-w-[240px]">
            <div className="flex gap-1 bg-muted p-1 rounded-md mb-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs flex-1 text-muted-foreground"
              >
                Modules
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs flex-1 font-semibold"
              >
                Events
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <CustomiseEventPanel
                event={mockEvents[0]}
                modules={mockModules}
              />
              <CustomiseEventPanel
                event={mockEvents[1]}
                modules={mockModules}
              />
              <CustomiseEventPanel
                event={mockEvents[2]}
                modules={mockModules}
              />
            </div>
          </div>

          <div className="w-[1px] bg-border self-stretch" />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b min-w-[320px]">
              <span className="text-sm font-semibold">
                {mockEvents[0].event.name} |{" "}
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {mockEvents[0].event.code}
                </span>
              </span>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 px-3 text-xs"
                >
                  Discard
                </Button>
              </div>
            </div>

            <CustomiseEventCard
              event={mockEvents[0]}
              modules={mockModules}
              onUpdate={() => {}}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
