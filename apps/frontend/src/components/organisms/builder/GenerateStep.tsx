"use client";

import React, { useState } from "react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Separator } from "@/components/atoms/baseShadcn/separator";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { Checkbox } from "@/components/atoms/baseShadcn/checkbox";
import CustomiseShellPopup from "@/components/organisms/customise/CustomiseShellPopup";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface GenerateStepProps {
  modules: ModuleResponseDto[];
  events: EventResponse[];
  onGenerate: (name: string, selectedEventIds: string[]) => void;
  isGenerating: boolean;
  //props for editing
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
  const found = modules.find((m) => m.moduleID === moduleID);
  if (found) {
    return found;
  }
  return null;
}

function formatTime(start: string, end: string) {
  if (!start || !end) {
    return null;
  }
  return start + " - " + end;
}

export function GenerateStep({
  modules,
  events,
  onGenerate,
  isGenerating,
  isEditMode,
  timetableName,
  setTimetableName,
  selectedEventIds,
  setSelectedEventIds,
}: GenerateStepProps) {
  const router = useRouter();

  //checkbox logic

  function checkboxLogic(eventId: string, isChecked: boolean) {
    if (isChecked) {
      //add the event to the list
      setSelectedEventIds([...selectedEventIds, eventId]);
    } else {
      //add every event that is not the unchecked id
      const updatedList: string[] = [];

      for (const id of selectedEventIds) {
        if (id !== eventId) {
          updatedList.push(id);
        }
      }

      setSelectedEventIds(updatedList);
    }
  }

  function renderModulesSummary() {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Modules
          </h3>
          <span className="text-sm text-[var(--text-secondary)]">
            {modules.length} module{modules.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {modules.map((module) => {
            return (
              <div
                key={module.moduleID}
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
              >
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: module.styling?.colour || "var(--border)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-base text-[var(--text-primary)] truncate">
                    {module.moduleName}
                  </p>
                  <p className="text-sm font-mono text-[var(--text-secondary)]">
                    {module.moduleCode}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderEventsSummary() {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Events - {events.length} event{events.length !== 1 ? "s" : ""}
          </h3>
          <span>
            <CustomiseShellPopup />
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {events.map((event) => {
            const criteria = event.eventCriteria;
            const isEventChecked = selectedEventIds.includes(event.eventId);
            const linkedModule = getLinkedModule(
              event.eventCriteria?.moduleId,
              modules,
            );
            const timeString = formatTime(
              criteria?.startTime || "",
              criteria?.endTime || "",
            );

            return (
              <div
                key={event.eventId}
                className="flex flex-row items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
              >
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <p className="text-base font-medium text-[var(--text-primary)]">
                    {event.eventName || "Event"}
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
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
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
                      {event.activityType}
                    </p>
                  </div>
                </div>

                <span className="flex-shrink-0 flex items-center justify-center">
                  <Checkbox
                    data-testid="schedule-Timetable-Checkbox"
                    id={`event-${event.eventId}`}
                    checked={isEventChecked}
                    onCheckedChange={(checkedState) =>
                      checkboxLogic(event.eventId, checkedState === true)
                    }
                  />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderLoadingState() {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-5 w-24 mt-2" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }

  function renderContent() {
    if (isGenerating) {
      return renderLoadingState();
    }

    return (
      <div className="flex flex-col gap-6">
        {/* {renderModulesSummary()}
        <Separator className="bg-[var(--border)]" /> */}
        {renderEventsSummary()}
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-2xl flex justify-left pb-4">
        <Button
          data-testid="schedules-Create-Btn"
          type="button"
          variant="ghost"
          size="default"
          onClick={() => {
            router.push("/builder");
          }}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[var(--duration-fast)]"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Back
        </Button>
      </div>
      <div
        data-testid="create-Schedule-Div"
        className="mx-auto w-full max-w-2xl px-4 py-4 border rounded-xl border-[var(--border)] bg-[var(--bg-surface)] min-h-150"
      >
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Review and generate
          </h2>
          <p className="text-base text-[var(--text-secondary)] mt-1">
            Check your events before generating your schedule.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-2">
          <Label
            htmlFor="timetable-name"
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            Schedule Name
          </Label>
          <Input
            data-testid="schedule-Timetable-Input"
            id="timetable-name"
            value={timetableName}
            onChange={(e) => setTimetableName(e.target.value)}
            placeholder="e.g. Semester 1, 2024"
            className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring)]"
          />
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
