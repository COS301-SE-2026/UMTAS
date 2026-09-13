"use client";

import React, { Suspense, useState, useCallback } from "react";
import { Separator } from "@/components/atoms/baseShadcn/separator";
import { ScheduleHeader } from "@/components/molecules/viewTimetable/ScheduleHeader";
import { ScheduleView } from "@/components/organisms/viewTimetable/ScheduleView";
import Tutorial from "@/components/organisms/nav/Tutorial";

const steps = [
  {
    target: "#schedule-header",
    content:
      "View your schedule summary, including module and event counts, and export your timetable from here.",
  },
  {
    target: "#schedule-view",
    content:
      "Select a timetable, navigate between weeks, and manage your saved schedules here.",
  },
];

export default function SchedulesPage() {
  const [eventCount, setEventCount] = useState(0);
  const [moduleCount, setModuleCount] = useState(0);

  const exportRef = React.useRef<(() => void) | null>(null);

  const handleExportReady = useCallback((fn: () => void) => {
    exportRef.current = fn;
  }, []);

  function handleExport() {
    exportRef.current?.();
  }

  return (
    <>
      <Tutorial steps={steps} wait={true} />

      <div className="bg-[var(--bg-base)] flex flex-col min-h-[calc(100vh-56px)]">
        <div id="schedule-header">
          <ScheduleHeader
            eventCount={eventCount}
            moduleCount={moduleCount}
            onExport={handleExport}
          />
        </div>
        <Separator className="bg-[var(--border)]" />

        <div className="px-8 py-6">
          <div id="schedule-view" className="mx-auto max-w-6xl">
            <Suspense
              fallback={
                <div className="py-12 text-sm text-[var(--text-secondary)]">
                  Loading schedule...
                </div>
              }
            >
              <ScheduleView
                onEventCountChange={setEventCount}
                onModuleCountChange={setModuleCount}
                onExportReady={handleExportReady}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
