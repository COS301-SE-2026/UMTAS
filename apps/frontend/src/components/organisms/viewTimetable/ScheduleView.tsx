"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { WeeklyGrid } from "@/components/organisms/viewTimetable/WeeklyGrid";
import { EmptySchedule } from "@/components/organisms/viewTimetable/EmptySchedule";
import { WeekNavBar } from "@/components/molecules/viewTimetable/WeekNavBar";
import { GenerateStep } from "@/components/organisms/builder/GenerateStep";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogTitle,
} from "@/components/atoms/baseShadcn/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { getAllWeekStarts, resolveScheduleEvents } from "@/lib/scheduleUtils";

import { downloadICS, generateICS } from "@/lib/ICS-utils/ICS";
import { Button } from "@/components/atoms/baseShadcn/button";

import { useQuery } from "@tanstack/react-query";

import {
  getAllTimetablesQ,
  getTimetableByIdQ,
  addTimetableMut,
  updateTimetableMut,
} from "@/components/templates/builder/Queries/timetableQueries";
import { getQueryClient } from "@/components/tanstack/getQueryClient";

import { useSearchParams } from "next/navigation";

import { getAllEventsQ } from "@/components/templates/builder/Queries/eventQueries";
import { getAllModulesQ } from "@/components/templates/builder/Queries/moduleQueries";
import { removeTimetableMut } from "@/components/templates/builder/Queries/timetableQueries";
import { useMutation } from "@tanstack/react-query";
import { fetchAllModules } from "@/app/course-management/queries/modules/moduleBuilder";
import { UserDetails } from "@/lib/userclass/userClass";

import Tutorial from "@/components/organisms/nav/Tutorial";
const steps = [
  {
    target: "#ref-go-to-builder",
    content: "Go to the builder page to create a schedule",
  },
];

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
  const router = useRouter();
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  //most of these are straight copied and pasted from wizard shell
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<"Generate" | "Timetable">(
    "Timetable",
  );
  const isEditMode = !!selectedTimetableId;
  const [timetableName, setTimetableName] = useState("My New Schedule");
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [OGeventId, setOGeventId] = useState<string[]>([]);
  const editId = selectedTimetableId;
  const searchParams = useSearchParams();
  const actionChecker = searchParams.get("action");

  const { mutateAsync: addTimetable } = useMutation(addTimetableMut());
  const { mutateAsync: updateTimetable } = useMutation(updateTimetableMut());

  const { data: allModules = [], isLoading: isLoadingModules } = useQuery({
    queryKey: ["Modules", "Courses"],
    queryFn: async () => {
      const result = await fetchAllModules({
        userEnrollment: true,
      });
      return result;
    },
  });
  const { data: allEvents = [], isLoading: isLoadingEvents } =
    useQuery(getAllEventsQ());
  const { data: timetables = [], isLoading: isLoadingTimetables } =
    useQuery(getAllTimetablesQ());
  const { mutate: deleteTimetable } = useMutation(removeTimetableMut());

  const isLoading = isLoadingModules || isLoadingEvents || isLoadingTimetables;

  useEffect(() => {
    if (timetables.length > 0 && !selectedTimetableId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTimetableId(
        String(timetables[timetables.length - 1].timetable.timetableID),
      );
    }
  }, [timetables, selectedTimetableId]);

  //this useEffect is the "memory" between the builder and schedules
  useEffect(() => {
    if (actionChecker === "new") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTimetableId("");
      setViewMode("Generate");

      router.replace("/schedules");
    }
  }, [actionChecker, router]);

  const { events, modules } = useMemo(() => {
    if (!selectedTimetableId) {
      return { events: [], modules: [] };
    }

    const selectedTT = timetables.find(
      (tt) => tt.timetable.timetableID === selectedTimetableId,
    );

    if (selectedTT) {
      const activeEventIds = (selectedTT.eventIds || []).map((id) =>
        String(id).trim(),
      );

      const activeEvents = allEvents.filter((e) =>
        activeEventIds.includes(String(e.eventId).trim()),
      );

      const activeModuleIds = activeEvents
        .map((e) => e.eventCriteria?.moduleId)
        .filter(Boolean);

      const activeModules = allModules.filter((m) =>
        activeModuleIds.includes(m.moduleID),
      );

      return { events: activeEvents, modules: activeModules };
    }

    return { events: [], modules: [] };
  }, [selectedTimetableId, timetables, allEvents, allModules]);

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

  const currentWeekStart = useMemo(() => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    const dateDifference = date.getDate() - day + (day === 0 ? -6 : 1); //adj if day is sun
    date.setDate(dateDifference);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [selectedDate]);

  function handlePrevWeek() {
    setSelectedDate((prev) => {
      const date = new Date(prev);
      date.setDate(date.getDate() - 7);
      return date;
    });
  }

  function handleNextWeek() {
    setSelectedDate((prev) => {
      const date = new Date(prev);
      date.setDate(date.getDate() + 7);
      return date;
    });
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

  //NB check viewMode otherwise the generate step does not show on this page
  if (timetables.length === 0 && viewMode !== "Generate") {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Tutorial steps={steps} wait={true} />

        <p className="text-base text-[var(--text-secondary)]">
          No timetables found.
        </p>
        <a
          id="ref-go-to-builder"
          href="/builder"
          className="text-sm font-medium text-[var(--btn-primary-bg)] hover:underline"
        >
          Go to Builder to create one
        </a>
      </div>
    );
  }

  //delete timetable (works)

  function deleteDialog() {
    if (!selectedTimetableId) {
      return;
    }

    setIsDeleteDialogOpen(true);
  }

  async function deleteTimetableByID() {
    setIsDeleteDialogOpen(false);

    if (!selectedTimetableId) return;

    deleteTimetable(selectedTimetableId, {
      onSuccess: () => {
        setSelectedTimetableId("");
        setSelectedDate(new Date());
      },

      onError: (error) => {
        console.error("error while deleting timetable", error);
      },
    });
  }

  //edit timetable (broken currently)

  async function editTimetable() {
    if (!selectedTimetableId) return;

    try {
      const queryClient = getQueryClient();
      const timetableRes = await queryClient.fetchQuery(
        getTimetableByIdQ(selectedTimetableId),
      );

      setTimetableName(
        timetableRes.timetable.timetableName || "Updated Schedule",
      );

      setOGeventId((timetableRes.eventIds || []).map(String));
      setSelectedEventIds((timetableRes.eventIds || []).map(String));

      setIsGenerating(false);

      setViewMode("Generate");
    } catch (error) {
      console.error("edit timetable error", error);
    }
  }

  //the functions below are copied, pasted and slightly changed from the wizard shell. you'll see wizard shell is a lot shorter
  async function handleGenerate(name: string, selectedEventIds: string[]) {
    setIsGenerating(true);
    try {
      const finalEvents = selectedEventIds.map((id) => id);

      if (editId) {
        const noNumIds = OGeventId.filter(
          (id) => !selectedEventIds.includes(id),
        );

        const numbersOnlyAddIds = selectedEventIds.filter(
          (id) => !OGeventId.includes(id),
        );

        await updateTimetable({
          path: { id: editId },
          body: {
            timetableName: name || "Updated Schedule",
            removeEventIds: noNumIds,
            addEventIds: numbersOnlyAddIds,
          },
        });
      } else {
        await addTimetable({
          body: {
            timetableName: name || "Generated Schedule",
            eventIds: finalEvents,
          },
        });
      }

      const queryClient = getQueryClient();

      await queryClient.invalidateQueries({
        queryKey: getAllTimetablesQ().queryKey,
      });

      setViewMode("Timetable");
    } catch (error) {
      console.error("Failed to generate timetable:", error);
      setIsGenerating(false);
    }
  }

  function renderView() {
    if (viewMode === "Generate") {
      return (
        <GenerateStep
          modules={allModules}
          events={allEvents}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          isEditMode={isEditMode}
          timetableName={timetableName}
          setTimetableName={setTimetableName}
          selectedEventIds={selectedEventIds}
          setSelectedEventIds={setSelectedEventIds}
        />
      );
    }

    return (
      <>
        <div
          data-testid="schedules-Calendar-Div"
          className="flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-64">
              <Select
                value={String(selectedTimetableId)}
                onValueChange={(newValue) => {
                  setSelectedTimetableId(newValue);
                  setSelectedDate(new Date());
                }}
              >
                <SelectTrigger className="bg-[var(--bg-surface)] border-[var(--border)]">
                  <SelectValue placeholder="Select a Timetable" />
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
              <div className="flex flex-col md:flex-row justify-between items-center w-full gap-2 md:gap-0">
                <WeekNavBar
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  weekStart={currentWeekStart}
                  onPrev={handlePrevWeek}
                  onNext={handleNextWeek}
                />
                <div className="flex flex-row justify-center md:justify-end w-full md:w-auto gap-2 mb-4 md:mb-0">
                  <Button
                    type="button"
                    className="h-7 px-3 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] hover:opacity-90"
                    onClick={editTimetable}
                  >
                    Edit
                  </Button>

                  <Button
                    data-testid="schedules-Delete-Btn"
                    type="button"
                    className="h-7 px-3 text-xs bg-[var(--destructive)] text-[var(--text-primary)] border-[var(--border)] hover:opacity-90"
                    onClick={deleteDialog}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to delete this timetable?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This cannot be undone
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      data-testid="Schedules-ConfirmDelete-Btn"
                      onClick={deleteTimetableByID}
                      variant="destructive"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <WeeklyGrid
                events={resolvedEvents}
                weekStart={currentWeekStart}
              />
            </div>
          )}
        </div>
      </>
    );
  }

  return <>{renderView()}</>;
}
