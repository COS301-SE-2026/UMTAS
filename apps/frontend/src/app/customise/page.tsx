"use client";
import { Card } from "@/components/atoms/baseShadcn/card";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { EventCard } from "@/components/molecules/builder/EventCard";
import { ModuleCard } from "@/components/molecules/builder/ModuleCard";
import { Button } from "@/components/atoms/baseShadcn/button";

//some mock data for the static pages
export const modules: ModuleResponseDto[] = [
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

export const events: EventResponse[] = [
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

function EventsPan() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex flex-1 items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 text-left"
        >
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-[var(--text-primary)] truncate">
              {events[0].event.name}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-sm font-mono text-[var(--text-secondary)]">
                {events[0].event.code}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">{""}</p>
              <p className="text-sm text-[var(--text-secondary)]">{"10:00"}</p>
              <p className="text-sm font-mono text-[var(--text-secondary)]">
                {"COS301"}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

function ModulesPan() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex flex-1 items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 text-left"
        >
          <span className="h-3 w-3 rounded-full flex-shrink-0" style={{}} />
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-[var(--text-primary)] truncate">
              {modules[0].moduleName}
            </p>
            <p className="text-sm font-mono text-[var(--text-secondary)]">
              {modules[0].moduleCode}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default function Customise() {
  return (
    <>
      <Card className="flex flex-row w-fit m-6 p-3">
        <div className="flex flex-col">
          <EventsPan />
          <EventsPan />
          <EventsPan />
          <EventsPan />
        </div>
        <EventCard event={events[0]} modules={modules} onUpdate={() => {}} />
      </Card>

      <br />

      <Card className="flex flex-row w-fit m-6 p-3">
        <div className="flex flex-col">
          <ModulesPan />
          <ModulesPan />
          <ModulesPan />
        </div>
        <ModuleCard module={modules[0]} onUpdate={() => {}} />
      </Card>
    </>
  );
}
