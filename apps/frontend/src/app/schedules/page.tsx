"use client";

import { EventBlock } from "@/components/molecules/viewTimetable/EventBlock";
import { Module } from "@/components/molecules/builder/ModuleCard";
import { BuilderEvent } from "@/components/molecules/builder/EventCard";
import { EventType } from "@/components/atoms/builder/eventDropdown";
import { EmptySchedule } from "@/components/organisms/viewTimetable/EmptySchedule";

function exampleModule(): Module {
  return {
    id: "1",
    code: "COS123",
    name: "Very fun module",
    colour: "red",
  };
}

function exampleEvent(): BuilderEvent {
  return {
    id: "1",
    name: "COS lecture",
    code: "COS123L",
    date: "2026/03/03",
    startTime: "9:30",
    endTime: "10:30",
    type: "lecture" as EventType,
    moduleId: "ID",
    isRecurring: true,
  };
}

export default function schedulesPage() {
  return (
    <div>
      <EventBlock event={exampleEvent()} module={exampleModule()} />
      <EmptySchedule />
    </div>
  );
}
