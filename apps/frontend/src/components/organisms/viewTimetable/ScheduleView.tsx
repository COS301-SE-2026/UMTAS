"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { WeeklyGrid } from "@/components/organisms/viewTimetable/WeeklyGrid";
import { EmptySchedule } from "@/components/organisms/viewTimetable/EmptySchedule";
import { WeekNavBar } from "@/components/molecules/viewTimetable/WeekNavBar";
import {
  getAllWeekStarts,
  resolveScheduleEvents,
  generateICS,
  downloadICS,
} from "@/lib/scheduleUtils";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import type { BuilderEvent } from "@/components/molecules/builder/EventCard";

interface ScheduleViewProps {
  onEventCountChange: (count: number) => void;
  onModuleCountChange: (count: number) => void;
  onExportReady: (exportFn: () => void) => void;
}

export function ScheduleView({
  onEventCountChange,
  onModuleCountChange,
  onExportReady,
}: ScheduleViewProps) {
  const [modules] = useState<ModuleResponseDto[]>(() => {
    if (typeof window !== "undefined") {
      const rawModules = localStorage.getItem("umtas-schedule-modules");
      return rawModules ? JSON.parse(rawModules) : [];
    }
    return [];
  });

  const [events] = useState<BuilderEvent[]>(() => {
    if (typeof window !== "undefined") {
      const rawEvents = localStorage.getItem("umtas-schedule-events");
      return rawEvents ? JSON.parse(rawEvents) : [];
    }
    return [];
  });

  const [isLoading] = useState(false);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  useEffect(() => {
    onModuleCountChange(modules.length);
    onEventCountChange(events.length);
  }, [modules.length, events.length, onModuleCountChange, onEventCountChange]);

  const doExport = useCallback(() => {
    const icsContent = generateICS(events, modules);
    downloadICS(icsContent, "umtas-schedule.ics");
  }, [events, modules]);

  useEffect(() => {
    onExportReady(doExport);
  }, [doExport, onExportReady]);
  const weekStarts = getAllWeekStarts(events);
  const currentWeekStart = weekStarts[currentWeekIndex] ?? null;
  const resolvedEvents = resolveScheduleEvents(events, modules);

  function handlePrevWeek() {
    if (currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1);
    }
  }

  function handleNextWeek() {
    if (currentWeekIndex < weekStarts.length - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1);
    }
  }

  function renderLoadingSkeleton() {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <div className="flex flex-col gap-1 mt-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return renderLoadingSkeleton();
  }

  if (events.length === 0) {
    return <EmptySchedule />;
  }

  if (!currentWeekStart) {
    return <EmptySchedule />;
  }

  return (
    <div className="flex flex-col">
      <WeekNavBar
        weekStart={currentWeekStart}
        currentIndex={currentWeekIndex}
        totalWeeks={weekStarts.length}
        onPrev={handlePrevWeek}
        onNext={handleNextWeek}
      />
      <WeeklyGrid events={resolvedEvents} weekStart={currentWeekStart} />
    </div>
  );
}
