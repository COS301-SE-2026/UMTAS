"use client";

import { EventBlock } from "@/components/molecules/viewTimetable/EventBlock";
import { Module } from "@/components/molecules/builder/ModuleCard";
import { BuilderEvent } from "@/components/molecules/builder/EventCard";
import { EventType } from "@/components/atoms/builder/eventDropdown";
import { EmptySchedule } from "@/components/organisms/viewTimetable/EmptySchedule";
import { ScheduleHeader } from "@/components/molecules/viewTimetable/ScheduleHeader";
import { WeekNavBar } from "@/components/molecules/viewTimetable/WeekNavBar";
import { ScheduleEvent } from "@/types/schedule";
import { WeeklyGrid } from "@/components/organisms/viewTimetable/WeeklyGrid";

function exampleModule(): Module {
  return {
    id: "1",
    code: "COS123",
    name: "Very fun module",
    colour: "red",
  };
}

const exampleEvent: ScheduleEvent = {
  id: "1",
  name: "Lecture",
  code: "COS 301",
  date: "2026-05-20",
  startTime: "12:30",
  endTime: "13:20",
  isRecurring: true,
  accentColour: "#4f46e5",
  subLabel: "roos hall",
};

export default function schedulesPage() {
  return (
    <div>
      <EventBlock event={exampleEvent} />
      <EmptySchedule />
      <ScheduleHeader eventCount={1} moduleCount={1} onExport={EmptySchedule} />
      <WeekNavBar
        currentIndex={1}
        onNext={EmptySchedule}
        onPrev={EmptySchedule}
        totalWeeks={1}
        weekStart={new Date()}
      />
      <WeeklyGrid events={[exampleEvent]} weekStart={new Date()} />
    </div>
  );
}
