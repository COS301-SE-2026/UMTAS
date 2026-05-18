"use client";

import { EventCard } from "@/components/molecules/builder/EventCard";

export default function EventBuilderPreview() {
  const mockEvent = {
    id: "1",
    name: "COS301 Lecture Group A",
    code: "COS301-LEC-A",
    date: "2026-05-20",
    startTime: "08:30",
    endTime: "10:30",
    type: "lecture" as any,
    moduleId: "mod-1",
  };

  const mockModules = [
    {
      id: "mod-1",
      name: "Computer Science 301",
      code: "COS301",
      colour: "#blue",
    },
  ];

  return (
    <div className="p-6 max-w-xl mx-auto bg-zinc-950 min-h-screen">
      <EventCard
        event={mockEvent}
        index={0}
        modules={mockModules}
        onUpdate={() => {}}
        onRemove={() => {}}
      />
    </div>
  );
}
