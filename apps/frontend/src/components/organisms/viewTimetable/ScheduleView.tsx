"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { WeeklyGrid } from "@/components/organisms/viewTimetable/WeeklyGrid";
import { EmptySchedule } from "@/components/organisms/viewTimetable/EmptySchedule";
import { WeekNavBar } from "@/components/molecules/viewTimetable/WeekNavBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { getAllWeekStarts, resolveScheduleEvents } from "@/lib/scheduleUtils";
import {
  getAllModulesBuilder,
  type ModuleResponseDto,
} from "@/app/builder/utils/modules/requestBuilders";
import {
  getAllEventsBuilder,
  type EventResponse,
} from "@/app/builder/utils/events/eventRequestBuilder";
import {
  deleteTTbyIDBuilder,
  getAllTimeTablesBuilder,
  type TimetableResponse,
} from "@/app/builder/utils/timetables/TimeTableRequests";
import { downloadICS, generateICS } from "@/lib/ICS-utils/ICS";
import { Button } from "@/components/atoms/baseShadcn/button";
import { log, time } from "console";

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
  const [allModules, setAllModules] = useState<ModuleResponseDto[]>([]);
  const [allEvents, setAllEvents] = useState<EventResponse[]>([]);
  const [timetables, setTimetables] = useState<TimetableResponse[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<number>();

  const [isLoading, setIsLoading] = useState(true);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [modulesRes, eventsRes, timetablesRes] = await Promise.all([
          new getAllModulesBuilder().send({}),
          new getAllEventsBuilder().send({}),
          new getAllTimeTablesBuilder().send({}),
        ]);

        setAllModules(modulesRes.modules);
        setAllEvents(eventsRes.events);

        const fetchedTimetables = timetablesRes.timetables || [];
        setTimetables(fetchedTimetables);

        if (fetchedTimetables.length > 0) {
          setSelectedTimetableId(
            fetchedTimetables[fetchedTimetables.length - 1].timetable
              .timetableID,
          );
        }
      } catch (error) {
        console.error("Failed to fetch schedule data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const { events, modules } = useMemo(() => {
    if (!selectedTimetableId) {
      return { events: [], modules: [] };
    }

    const selectedTT = timetables.find(
      (tt) => tt.timetable.timetableID === selectedTimetableId,
    );

    if (selectedTT && selectedTT.eventIds) {
      const activeEventIds = selectedTT.eventIds.map(String);
      const activeEvents = allEvents.filter((e) =>
        activeEventIds.includes(String(e.event.eventID)),
      );

      const activeModuleIds = activeEvents
        .map((e) => e.lecture?.moduleID)
        .filter(Boolean);

      const activeModules = allModules.filter((m) =>
        activeModuleIds.includes(m.moduleID),
      );

      return { events: activeEvents, modules: activeModules };
    }

    return { events: [], modules: [] };
  }, [selectedTimetableId, timetables, allEvents, allModules]);

  const weekStarts = useMemo(() => getAllWeekStarts(events), [events]);
  const resolvedEvents = useMemo(
    () => resolveScheduleEvents(events, modules),
    [events, modules],
  );

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
  const currentWeekStart = weekStarts[currentWeekIndex] ?? null;

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

  if (timetables.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-base text-[var(--text-secondary)]">
          No timetables found.
        </p>
        <a
          href="/builder"
          className="text-sm font-medium text-[var(--btn-primary-bg)] hover:underline"
        >
          Go to Builder to create one
        </a>
      </div>
    );
  }

  //delete timetable
  async function deleteTimetableByID() {
    if (!selectedTimetableId) {
      return;
    }

    const confirm = window.confirm(
      "Are you sure you want to delete this timetable?",
    );

    if (!confirm) {
      return;
    }

    try {
      const builder = new deleteTTbyIDBuilder();

      await builder.send({
        paths: { id: selectedTimetableId },
      });

      //remove currently selected timetable
      const remainingTimetables = timetables.filter(
        (timetable) => timetable.timetable.timetableID !== selectedTimetableId,
      );

      setTimetables(remainingTimetables);

      if (remainingTimetables.length > 0) {
        setSelectedTimetableId(remainingTimetables[0].timetable.timetableID);
        setCurrentWeekIndex(0);
      }

      //console.log("Timetable successfully added");
    } catch {
      //console.error("Error with sending delete request");
      alert(
        "An error occured while deleting your timetable. Please refresh and try again.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="w-64">
          <Select
            value={String(selectedTimetableId)}
            onValueChange={(newValue) => {
              setSelectedTimetableId(Number(newValue));
              setCurrentWeekIndex(0);
            }}
          >
            <SelectTrigger className="bg-[var(--bg-surface)] border-[var(--border)]">
              <SelectValue placeholder="Select a timetable" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)]">
              {timetables.map((tt) => (
                <SelectItem
                  key={tt.timetable.timetableID}
                  value={String(tt.timetable.timetableID)}
                  className="text-[var(--text-primary)]"
                >
                  {tt.timetable.timetableName ||
                    `Timetable ${tt.timetable.timetableID}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!currentWeekStart || events.length === 0 ? (
        <EmptySchedule />
      ) : (
        <div className="flex flex-col">
          <div className="flex flex-row justify-between items-center w-full">
            <WeekNavBar
              weekStart={currentWeekStart}
              currentIndex={currentWeekIndex}
              totalWeeks={weekStarts.length}
              onPrev={handlePrevWeek}
              onNext={handleNextWeek}
            />
            <div className="flex flex-row justify-end gap-1">
              <Button
                type="button"
                className="h-7 px-3 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] hover:opacity-90"
              >
                Edit
              </Button>

              <Button
                type="button"
                className="h-7 px-3 text-xs bg-[var(--destructive)] text-[var(--text-primary)] border-[var(--border)] hover:opacity-90"
                onClick={deleteTimetableByID}
              >
                Delete
              </Button>
            </div>
          </div>
          <WeeklyGrid events={resolvedEvents} weekStart={currentWeekStart} />
        </div>
      )}
    </div>
  );
}
