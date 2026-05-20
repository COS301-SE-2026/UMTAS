"use client";

import React, { useState, useCallback } from "react";
import { Separator } from "@/components/atoms/baseShadcn/separator";
import { ScheduleHeader } from "@/components/molecules/viewTimetable/ScheduleHeader";
import { ScheduleView } from "@/components/organisms/viewTimetable/ScheduleView";

export default function SchedulesPage() {
  const [eventCount, setEventCount] = useState(0);
  const [moduleCount, setModuleCount] = useState(0);
  const [exportFn, setExportFn] = useState<(() => void) | null>(null);

  function handleExport() {
    if (exportFn) {
      exportFn();
    }
  }

  const handleExportReady = useCallback((fn: () => void) => {
    setExportFn(() => fn);
  }, []);

  return (
    <div className="bg-[var(--bg-base)] flex flex-col min-h-[calc(100vh-56px)]">
      <ScheduleHeader
        eventCount={eventCount}
        moduleCount={moduleCount}
        onExport={handleExport}
      />

      <Separator className="bg-[var(--border)]" />

      <div className="px-8 py-6">
        <div className="mx-auto max-w-6xl">
          <ScheduleView
            onEventCountChange={setEventCount}
            onModuleCountChange={setModuleCount}
            onExportReady={handleExportReady}
          />
        </div>
      </div>
    </div>
  );
}
