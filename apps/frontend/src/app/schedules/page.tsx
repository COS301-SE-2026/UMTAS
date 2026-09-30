"use client";

import React, { Suspense, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [eventCount, setEventCount] = useState(0);
  const [moduleCount, setModuleCount] = useState(0);
  const [isGenerateMode, setIsGenerateMode] = useState(false);
  const exportRef = useRef<() => void>(() => {});

  const handleExportReady = useCallback((exportFn: () => void) => {
    exportRef.current = exportFn;
  }, []);

  const handleExport = useCallback(() => {
    exportRef.current();
  }, []);

  return (
    <>
      <Tutorial steps={steps} wait={true} />

      <div className="w-full min-h-screen bg-[var(--bg-base)]">
        <div id="schedule-header" className="pt-6">
          <ScheduleHeader
            eventCount={eventCount}
            moduleCount={moduleCount}
            onExport={handleExport}
            isGenerateMode={isGenerateMode}
            onBack={() => router.push("/builder")}
          />
        </div>

        <div className="px-8 py-6">
          <div id="schedule-view" className="mx-auto w-full max-w-6xl">
            <Suspense
              fallback={
                <div className="text-sm text-[var(--text-secondary)]">
                  Loading schedule...
                </div>
              }
            >
              <ScheduleView
                onEventCountChange={setEventCount}
                onModuleCountChange={setModuleCount}
                onExportReady={handleExportReady}
                onGenerateModeChange={setIsGenerateMode}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
