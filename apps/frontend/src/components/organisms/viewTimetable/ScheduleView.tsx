"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
import { resolveScheduleEvents } from "@/lib/scheduleUtils";

import {
  downloadICS,
  generateAcademicCalendarICS,
} from "@/lib/calendar_export_utils/ics_export";
import { generateCalendarPayload } from "@/lib/calendar_export_utils/calendar_api";
import { syncToGoogleCalendar } from "@/lib/calendar_export_utils/gc_export";
import {
  ConsentRequiredError,
  GOOGLE_CALENDAR_PERMISSIONS_QUERY_KEY,
  fetchGoogleCalendarToken,
  hasGoogleCalendarPermissions,
  startCalendarConsent,
} from "@/lib/auth/google-calendar";
import GoogleExportDialog, {
  type GoogleExportNotice,
  type GoogleScheduleOption,
} from "@/components/molecules/viewTimetable/googleExport";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Alert, AlertDescription } from "@/components/atoms/baseShadcn/alert";
import { Dialog } from "@/components/atoms/baseShadcn/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getAllTimetablesQ,
  getTimetableByIdQ,
  addTimetableMut,
  removeTimetableMut,
  updateTimetableMut,
} from "@/components/templates/builder/Queries/timetableQueries";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import Tutorial from "@/components/organisms/nav/Tutorial";
import { fetchAllModulesv2 } from "../../../../utilities/V2-Builders/Modules";

const CALENDAR_TIMEZONE = "Africa/Johannesburg";
const GOOGLE_CALENDAR_EXPORT_TIMEOUT_MS = 60_000;

const emptySteps = [
  {
    target: "#ref-go-to-builder",
    content: "Go to the builder page to create a schedule",
  },
];

const steps = [
  {
    target: "#select-timetable",
    content: "Select your schedule here.",
  },
  {
    target: "#btn-edit",
    content: "Edit your schedule here.",
  },
  {
    target: "#btn-delete",
    content: "Delete your schedule.",
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<"Generate" | "Timetable">(
    "Timetable",
  );

  const [timetableName, setTimetableName] = useState("My New Schedule");
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [OGeventId, setOGeventId] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const actionChecker = searchParams.get("action");

  const { mutateAsync: addTimetable } = useMutation(addTimetableMut());
  const { mutateAsync: updateTimetable } = useMutation(updateTimetableMut());

  const [exportingTo, setExportingTo] = useState<"ics" | "google" | null>(null);
  const exportInProgress = useRef(false);
  const handledConsentReturn = useRef(false);
  const [isGoogleDialogOpen, setIsGoogleDialogOpen] = useState(false);
  const [googleDialogTimetableId, setGoogleDialogTimetableId] = useState("");
  const [exportNotice, setExportNotice] = useState<GoogleExportNotice | null>(
    null,
  );

  const { data: allModules = [], isLoading: isLoadingModules } = useQuery({
    queryKey: ["Modules", "Courses"],
    queryFn: async () => {
      const result = await fetchAllModulesv2({
        userEnrollment: true,
      });
      return result.modules;
    },
  });

  const { data: timetables = [], isLoading: isLoadingTimetables } =
    useQuery(getAllTimetablesQ());

  const {
    data: hasGoogleCalendarAccess,
    isLoading: isLoadingGoogleCalendarAccess,
  } = useQuery({
    queryKey: GOOGLE_CALENDAR_PERMISSIONS_QUERY_KEY,
    queryFn: hasGoogleCalendarPermissions,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { mutate: deleteTimetable } = useMutation(removeTimetableMut());

  const isLoading = isLoadingModules || isLoadingTimetables;

  useEffect(() => {
    if (
      timetables.length > 0 &&
      !selectedTimetableId &&
      viewMode !== "Generate"
    ) {
      const selectTimetable = window.setTimeout(() => {
        setSelectedTimetableId(
          String(timetables[timetables.length - 1].timetable.timetableID),
        );
      }, 0);
      return () => window.clearTimeout(selectTimetable);
    }
  }, [timetables, selectedTimetableId, viewMode]);

  useEffect(() => {
    if (actionChecker === "new") {
      const startGeneration = window.setTimeout(() => {
        setSelectedTimetableId("");
        setViewMode("Generate");
        router.replace("/schedules");
      }, 0);
      return () => window.clearTimeout(startGeneration);
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
      const activeEvents = selectedTT.events;

      const activeModuleIds = activeEvents
        .map((e) => e.eventCriteria?.moduleId)
        .filter(Boolean);

      const activeModules = allModules.filter((m) =>
        activeModuleIds.includes(m.moduleID),
      );

      return { events: activeEvents, modules: activeModules };
    }

    return { events: [], modules: [] };
  }, [selectedTimetableId, timetables, allModules]);

  const resolvedEvents = useMemo(
    () => resolveScheduleEvents(events, modules),
    [events, modules],
  );

  useEffect(() => {
    onModuleCountChange(modules.length);
    onEventCountChange(events.length);
  }, [modules.length, events.length, onModuleCountChange, onEventCountChange]);

  const exportToICS = useCallback(async () => {
    if (!selectedTimetableId || exportInProgress.current) return;

    exportInProgress.current = true;
    setExportingTo("ics");
    setExportNotice(null);
    try {
      const payload = await generateCalendarPayload(selectedTimetableId);
      const icsContent = generateAcademicCalendarICS(
        payload,
        CALENDAR_TIMEZONE,
      );
      downloadICS(icsContent, "umtas-schedule.ics");
      setExportNotice({
        variant: "success",
        message: "Calendar exported to ICS.",
      });
    } catch {
      setExportNotice({
        variant: "destructive",
        message: "Could not export this calendar to ICS.",
      });
    } finally {
      exportInProgress.current = false;
      setExportingTo(null);
    }
  }, [selectedTimetableId]);

  const exportToGoogleCalendar = useCallback(
    async (timetableId = selectedTimetableId) => {
      if (!timetableId || exportInProgress.current) return;

      exportInProgress.current = true;
      setExportingTo("google");
      setExportNotice(null);
      try {
        const token = await fetchGoogleCalendarToken();
        const payload = await generateCalendarPayload(timetableId);
        const exportController = new AbortController();
        const timeoutId = window.setTimeout(
          () => exportController.abort(),
          GOOGLE_CALENDAR_EXPORT_TIMEOUT_MS,
        );

        try {
          const result = await syncToGoogleCalendar(payload, {
            accessToken: token.accessToken,
            timezone: CALENDAR_TIMEZONE,
            signal: exportController.signal,
          });

          if (result.failed.length > 0) {
            setExportNotice({
              variant: "default",
              message: `UMTAS Calendar exported with ${result.failed.length} failed event${result.failed.length === 1 ? "" : "s"}.`,
            });
          } else {
            setExportNotice({
              variant: "success",
              message: `UMTAS Calendar updated (${result.created} added, ${result.updated} updated).`,
            });
          }
        } finally {
          window.clearTimeout(timeoutId);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setExportNotice({
            variant: "destructive",
            message:
              "UMTAS Calendar export timed out. Please try again in a moment.",
          });
          return;
        }
        if (error instanceof ConsentRequiredError) {
          const returnUrl = new URL(window.location.href);
          returnUrl.searchParams.set("calendarExportTimetable", timetableId);
          try {
            await startCalendarConsent(
              `${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`,
            );
          } catch {
            setExportNotice({
              variant: "destructive",
              message: "Could not start Google Calendar authorization.",
            });
          }
          return;
        }

        setExportNotice({
          variant: "destructive",
          message: "Could not export this timetable to Google Calendar.",
        });
      } finally {
        exportInProgress.current = false;
        setExportingTo(null);
      }
    },
    [selectedTimetableId],
  );

  const handleGoogleCalendarExport = useCallback(() => {
    setExportNotice(null);
    setGoogleDialogTimetableId(selectedTimetableId);
    setIsGoogleDialogOpen(true);
  }, [selectedTimetableId]);

  const connectGoogleCalendar = useCallback(async () => {
    if (!googleDialogTimetableId || exportInProgress.current) return;

    exportInProgress.current = true;
    setExportingTo("google");
    setExportNotice(null);
    const returnUrl = new URL(window.location.href);
    returnUrl.searchParams.set(
      "calendarExportTimetable",
      googleDialogTimetableId,
    );

    try {
      await startCalendarConsent(
        `${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`,
      );
    } catch {
      setExportNotice({
        variant: "destructive",
        message: "Could not start Google Calendar authorization.",
      });
      exportInProgress.current = false;
      setExportingTo(null);
    }
  }, [googleDialogTimetableId]);

  const confirmGoogleCalendarExport = useCallback(
    async (timetableId: string) => {
      await exportToGoogleCalendar(timetableId);
      setIsGoogleDialogOpen(false);
    },
    [exportToGoogleCalendar],
  );

  useEffect(() => {
    onExportReady(() => {
      void exportToICS();
    });
  }, [exportToICS, onExportReady]);

  useEffect(() => {
    const consentStatus = searchParams.get("calendarConsent");
    if (!consentStatus || handledConsentReturn.current) return;
    handledConsentReturn.current = true;

    const timetableId =
      searchParams.get("calendarExportTimetable") ?? selectedTimetableId;
    const cleanedParams = new URLSearchParams(searchParams.toString());
    cleanedParams.delete("calendarConsent");
    cleanedParams.delete("calendarExportTimetable");
    const cleanedUrl = `${window.location.pathname}${cleanedParams.size ? `?${cleanedParams}` : ""}`;

    if (consentStatus === "granted") {
      const resumeExport = window.setTimeout(() => {
        void exportToGoogleCalendar(timetableId).finally(() => {
          router.replace(cleanedUrl);
        });
      }, 0);
      return () => window.clearTimeout(resumeExport);
    } else {
      const showDeniedNotice = window.setTimeout(() => {
        setExportNotice({
          variant: "destructive",
          message: "Google Calendar access was not granted.",
        });
        router.replace(cleanedUrl);
      }, 0);
      return () => window.clearTimeout(showDeniedNotice);
    }
  }, [exportToGoogleCalendar, router, searchParams, selectedTimetableId]);

  const currentWeekStart = useMemo(() => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diffToMonday);
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

  if (timetables.length === 0 && viewMode !== "Generate") {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Tutorial steps={emptySteps} wait={true} />

        <p className="text-base text-[var(--text-secondary)]">
          No timetables found.
        </p>
        <a
          id="ref-go-to-builder"
          onClick={createTimetable}
          className="text-sm font-medium text-[var(--btn-primary-bg)] hover:underline"
        >
          Go to generator to create one
        </a>
      </div>
    );
  }

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

  function createTimetable() {
    setSelectedTimetableId("");
    setTimetableName("My New Schedule");
    setOGeventId([]);
    setSelectedEventIds([]);
    setIsGenerating(false);
    setViewMode("Generate");
  }

  async function handleGenerate(name: string, selectedEventIds: string[]) {
    if (name == "BACK" && selectedEventIds.length == 0) {
      setViewMode("Timetable");
      return;
    }

    setIsGenerating(true);
    try {
      const finalEvents = selectedEventIds.map((id) => id);

      if (selectedTimetableId != "") {
        const noNumIds = OGeventId.filter(
          (id) => !selectedEventIds.includes(id),
        );

        const numbersOnlyAddIds = selectedEventIds.filter(
          (id) => !OGeventId.includes(id),
        );

        await updateTimetable({
          path: { id: selectedTimetableId },
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
          key={selectedTimetableId || "new-timetable"}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          isEditMode={selectedTimetableId !== ""}
          timetableName={timetableName}
          setTimetableName={setTimetableName}
          selectedEventIds={selectedEventIds}
          setSelectedEventIds={setSelectedEventIds}
        />
      );
    }

    return (
      <>
        <Tutorial steps={steps} wait={true} />

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
                <SelectTrigger
                  id="select-timetable"
                  className="bg-[var(--bg-surface)] border-[var(--border)]"
                >
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
                    aria-label="Export to ICS"
                    id="btn-export-ics"
                    type="button"
                    disabled={exportingTo !== null}
                    className="h-7 px-3 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] hover:opacity-90"
                    onClick={() => void exportToICS()}
                  >
                    {exportingTo === "ics" ? "Exporting…" : "Export to ICS"}
                  </Button>
                  {!isLoadingGoogleCalendarAccess && (
                    <Button
                      aria-label="Connect Google Calendar"
                      id="btn-export-google-calendar"
                      type="button"
                      disabled={exportingTo !== null}
                      className="h-7 px-3 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] hover:opacity-90"
                      onClick={handleGoogleCalendarExport}
                    >
                      {exportingTo === "google"
                        ? "Exporting…"
                        : hasGoogleCalendarAccess
                          ? "Export to UMTAS Calendar"
                          : "Connect Google Calendar"}
                    </Button>
                  )}
                  <Button
                    aria-label="Create Timetable"
                    id="btn-create"
                    type="button"
                    className="h-7 px-3 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] hover:opacity-90"
                    onClick={createTimetable}
                  >
                    Create Timetable
                  </Button>

                  <Button
                    aria-label="Edit Timetable"
                    id="btn-edit"
                    type="button"
                    className="h-7 px-3 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] hover:opacity-90"
                    onClick={editTimetable}
                  >
                    Edit Timetable
                  </Button>

                  <Button
                    aria-label="Delete Timetable"
                    id="btn-delete"
                    data-testid="schedules-Delete-Btn"
                    type="button"
                    className="h-7 px-3 text-xs bg-[var(--destructive)] text-[var(--text-primary)] border-[var(--border)] hover:opacity-90"
                    onClick={deleteDialog}
                  >
                    Delete Timetable
                  </Button>
                </div>
              </div>
              {exportNotice && (
                <Alert
                  variant={exportNotice.variant}
                  aria-live="polite"
                  className="mt-2"
                >
                  <AlertDescription>{exportNotice.message}</AlertDescription>
                </Alert>
              )}
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

  const googleSchedules: GoogleScheduleOption[] = timetables.map((tt) => ({
    id: String(tt.timetable.timetableID),
    name:
      tt.timetable.timetableName ||
      `Timetable ${String(tt.timetable.timetableID)}`,
  }));

  return (
    <>
      {renderView()}
      <Dialog open={isGoogleDialogOpen} onOpenChange={setIsGoogleDialogOpen}>
        <GoogleExportDialog
          hasGoogleCalendarAccess={Boolean(hasGoogleCalendarAccess)}
          isLoading={isLoadingGoogleCalendarAccess}
          isExporting={exportingTo === "google"}
          schedules={googleSchedules}
          selectedScheduleId={googleDialogTimetableId}
          onScheduleChange={setGoogleDialogTimetableId}
          onSignIn={() => void connectGoogleCalendar()}
          onExport={(timetableId) =>
            void confirmGoogleCalendarExport(timetableId)
          }
          notice={exportNotice}
        />
      </Dialog>
    </>
  );
}
