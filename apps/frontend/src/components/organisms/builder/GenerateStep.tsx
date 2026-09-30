"use client";

import React, { useState } from "react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { Checkbox } from "@/components/atoms/baseShadcn/checkbox";
import CustomiseShellPopup from "@/components/organisms/customise/CustomiseShellPopup";
import Tutorial from "@/components/organisms/nav/Tutorial";
import { useQuery } from "@tanstack/react-query";
import { fetchAllModulesv2 } from "../../../../utilities/V2-Builders/Modules";
import Popup from "@/components/atoms/utility/floatContainer";
import SolverPreferences from "../solver/SolverPreferences";
import { UserDetails } from "@/lib/userclass/userClass";

let eventAdded = false;

const baseSteps = [
  {
    target: "#timetable-name",
    content: "Name your schedule.",
  },
  {
    target: "#btn-customise-schedule",
    content: "Customise your events and modules.",
  },
  {
    target: "#btn-create-schedule",
    content: "Create your timetable.",
  },
  {
    target: "#btn-solve-timetable",
    content: "Solve your timetable.",
  },
];

const extendedSteps: typeof baseSteps = [];

interface GenerateStepProps {
  onGenerate: (name: string, selectedEventIds: string[]) => void;
  isGenerating: boolean;
  isEditMode: boolean;
  timetableName: string;
  setTimetableName: (name: string) => void;
  selectedEventIds: string[];
  setSelectedEventIds: React.Dispatch<React.SetStateAction<string[]>>;
}

function getLinkedModule(
  moduleID: string | null | undefined,
  modules: ModuleResponseDto[],
) {
  if (!moduleID) return null;

  const found = modules.find((module) => module.moduleID === moduleID);
  return found ?? null;
}

function formatTime(start: string, end: string) {
  if (!start || !end) {
    return null;
  }

  return start + " - " + end;
}

export function GenerateStep({
  onGenerate,
  isGenerating,
  isEditMode,
  timetableName,
  setTimetableName,
  selectedEventIds,
  setSelectedEventIds,
}: GenerateStepProps) {
  const [showSolver, setShowSolver] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: modules = [] } = useQuery({
    queryKey: ["Modules"],
    queryFn: async () => {
      const result = await fetchAllModulesv2({
        userEnrollment: true,
      });
      return result.modules;
    },
  });

  const events = modules.flatMap((module) => module?.Events ?? []);
  const isAdmin = UserDetails.getUniDetails()?.role === "UNIVERSITY_ADMIN";

  const filteredEvents = events.filter((event) => {
    if (!searchQuery.trim()) {
      return true;
    }

    const query = searchQuery.toLowerCase();
    const linkedModule = getLinkedModule(
      event?.eventCriteria?.moduleId,
      modules,
    );

    const matchName = event?.eventName?.toLowerCase().includes(query);
    const matchCode = event?.activityCode?.toLowerCase().includes(query);
    const matchModuleName = linkedModule?.moduleName
      ?.toLowerCase()
      .includes(query);
    const matchModuleCode = linkedModule?.moduleCode
      ?.toLowerCase()
      .includes(query);

    return matchName || matchCode || matchModuleName || matchModuleCode;
  });

  function checkboxLogic(eventId: string, isChecked: boolean) {
    if (isChecked) {
      setSelectedEventIds([...selectedEventIds, eventId]);
      return;
    }

    setSelectedEventIds(selectedEventIds.filter((id) => id !== eventId));
  }

  function getSelectedModules() {
    const selectedEvents = events.filter((event) =>
      selectedEventIds.includes(event?.eventId ?? ""),
    );

    return modules.filter((module) =>
      selectedEvents.some(
        (event) => event?.eventCriteria.moduleId === module.moduleID,
      ),
    );
  }

  function renderEventList() {
    if (isGenerating) {
      return (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      );
    }

    if (filteredEvents.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
          No events found.
        </p>
      );
    }

    return (
      <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto pr-2">
        {filteredEvents.map((event) => {
          const criteria = event?.eventCriteria;
          const isEventChecked = selectedEventIds.includes(
            event?.eventId ?? "",
          );
          const linkedModule = getLinkedModule(
            event?.eventCriteria?.moduleId,
            modules,
          );
          const timeString = formatTime(
            criteria?.startTime || "",
            criteria?.endTime || "",
          );

          if (!eventAdded && event) {
            extendedSteps.push({
              target: `#event-${event.eventId}`,
              content: "Select event to be added to schedule.",
            });
            eventAdded = true;
          }

          return (
            <div
              data-testid="outer-schedule-div"
              key={event?.eventId}
              className="flex flex-row items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-[var(--text-primary)]">
                  {event?.eventName || "Event"}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {criteria?.date && (
                    <p className="text-sm text-[var(--text-secondary)]">
                      {criteria.date}
                    </p>
                  )}

                  {timeString && (
                    <p className="text-sm text-[var(--text-secondary)]">
                      {timeString}
                    </p>
                  )}

                  {linkedModule && (
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            linkedModule.styling?.colour || "var(--border)",
                        }}
                      />
                      <p className="text-sm font-mono text-[var(--text-secondary)]">
                        {linkedModule.moduleCode}
                      </p>
                    </div>
                  )}

                  <p className="text-sm font-mono text-[var(--text-secondary)] uppercase">
                    {event?.activityType}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Checkbox
                  data-testid="schedule-Timetable-Checkbox"
                  id={`event-${event?.eventId}`}
                  checked={isEventChecked}
                  onCheckedChange={(checkedState) =>
                    checkboxLogic(event?.eventId ?? "", checkedState === true)
                  }
                  className="cursor-pointer border border-[var(--text-secondary)] bg-[var(--bg-surface)] data-[state=checked]:border-[var(--btn-primary-bg)] data-[state=checked]:bg-[var(--btn-primary-bg)] data-[state=checked]:text-[var(--btn-primary-text)]"
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const steps = [...baseSteps, ...extendedSteps];

  return (
    <div className="flex w-full flex-col gap-6">
      <Tutorial steps={steps} wait={true} />

      <div className="flex flex-col gap-4">
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px] md:items-end">
          <div className="flex w-full flex-col gap-2">
            <Label
              htmlFor="timetable-name"
              className="text-sm font-semibold text-[var(--text-secondary)]"
            >
              Schedule Name
            </Label>
            <Input
              data-testid="schedule-Timetable-Input"
              id="timetable-name"
              value={timetableName}
              onChange={(event) => setTimetableName(event.target.value)}
              placeholder="e.g. Semester 1, 2024"
              className="h-10 w-full bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring)]"
            />
          </div>

          <div className="flex w-full flex-col gap-2">
            <Label
              htmlFor="search-events"
              className="text-sm font-semibold text-[var(--text-secondary)]"
            >
              Search Events
            </Label>
            <Input
              id="search-events"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 w-full bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
            />
          </div>

          {isAdmin && (
            <div className="flex w-full justify-end md:w-10 md:justify-self-end">
              <div className="h-10 w-10 [&_button]:h-10 [&_button]:w-10 [&_button]:p-0 [&_svg]:h-4 [&_svg]:w-4">
                <CustomiseShellPopup />
              </div>
            </div>
          )}
        </div>

        <div
          data-testid="create-Schedule-Div"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"
        >
          {renderEventList()}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button
          id="btn-create-schedule"
          data-testid="schedules-Create-Btn"
          type="button"
          variant="default"
          size="default"
          disabled={isGenerating || selectedEventIds.length === 0}
          onClick={() => onGenerate(timetableName, selectedEventIds)}
        >
          {isGenerating
            ? "Generating..."
            : selectedEventIds.length === 0
              ? "Select At Least One Event"
              : isEditMode
                ? "Edit Timetable"
                : "Generate Timetable"}
        </Button>

        <Button
          id="btn-solve-timetable"
          data-testid=""
          type="button"
          size="default"
          variant="default"
          disabled={isGenerating || selectedEventIds.length === 0}
          onClick={() => setShowSolver(true)}
          className="w-fit px-4 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
        >
          Solve Timetable
        </Button>
      </div>

      {showSolver && (
        <Popup onClose={() => setShowSolver(false)}>
          <div className="flex w-120 justify-center">
            <SolverPreferences
              modules={getSelectedModules()}
              timetableName={timetableName}
              onJobCompleteAction={() => onGenerate("BACK", [])}
            />
          </div>
        </Popup>
      )}
    </div>
  );
}
