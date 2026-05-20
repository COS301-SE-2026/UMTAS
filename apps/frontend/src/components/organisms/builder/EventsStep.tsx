"use client";

import React, { useState } from "react";
import { Plus, Trash2, CheckCircle, Inbox, AlertCircle } from "lucide-react";
import {
  EventCard,
  type EventErrors,
} from "@/components/molecules/builder/EventCard";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/atoms/baseShadcn/alert-dialog";
import { Alert, AlertDescription } from "@/components/atoms/baseShadcn/alert";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Card, CardContent } from "@/components/atoms/baseShadcn/card";

interface EventsStepProps {
  events: EventResponse[];
  modules: ModuleResponseDto[];
  onAdd: () => void;
  onUpdate: (id: number, field: string, value: string | boolean) => void;
  onRemove: (id: number) => void;
  onGoToModules: () => void;
}

function validateEvent(event: EventResponse): {
  errors: EventErrors;
  hasErrors: boolean;
} {
  const errors: EventErrors = {};
  let hasErrors = false;

  const criteria = event.event.eventCriteria;

  if (!criteria?.moduleCode?.trim()) {
    errors.name = "Name/Code is required";
    hasErrors = true;
  }
  if (!criteria?.day) {
    errors.date = "Day is required";
    hasErrors = true;
  }
  if (!criteria?.startTime || !criteria?.endTime) {
    errors.time = "Start and end time are required";
    hasErrors = true;
  }
  if (
    criteria?.startTime &&
    criteria?.endTime &&
    criteria.startTime >= criteria.endTime
  ) {
    errors.time = "Start time must be before end time";
    hasErrors = true;
  }
  if (criteria?.type === "lecture" && !event.lecture?.moduleID) {
    errors.moduleId = "A module must be assigned to a lecture";
    hasErrors = true;
  }

  return { errors, hasErrors };
}

function isEventComplete(event: EventResponse) {
  const criteria = event.event.eventCriteria;
  if (!criteria?.moduleCode) return false;
  if (!criteria?.day) return false;
  if (!criteria?.startTime) return false;
  if (!criteria?.endTime) return false;
  if (criteria?.type === "lecture" && !event.lecture?.moduleID) return false;
  return true;
}

function getLinkedModuleName(
  event: EventResponse,
  modules: ModuleResponseDto[],
) {
  const found = modules.find((m) => m.moduleID === event.lecture?.moduleID);
  if (found) {
    return found.moduleCode + " - " + found.moduleName;
  }
  return null;
}

export function EventsStep({
  events,
  modules,
  onAdd,
  onUpdate,
  onRemove,
  onGoToModules,
}: EventsStepProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [errorMap, setErrorMap] = useState<Record<number, EventErrors>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showGuard, setShowGuard] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [snapshot, setSnapshot] = useState<EventResponse | null>(null);

  function requestNavigation(action: () => void) {
    if (isDirty) {
      setPendingAction(() => action);
      setShowGuard(true);
      return;
    }
    action();
  }

  function handleGuardConfirm() {
    if (snapshot) {
      const id = snapshot.event.eventID;
      const crit = snapshot.event.eventCriteria;
      onUpdate(id, "name", crit?.moduleCode || "");
      onUpdate(id, "date", crit?.day || "");
      onUpdate(id, "startTime", crit?.startTime || "");
      onUpdate(id, "endTime", crit?.endTime || "");
      onUpdate(id, "type", crit?.type || "lecture");
      onUpdate(id, "moduleId", String(snapshot.lecture?.moduleID || ""));
    }
    setIsDirty(false);
    setShowGuard(false);
    setSnapshot(null);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }

  function handleGuardCancel() {
    setShowGuard(false);
    setPendingAction(null);
  }

  function handleSelect(id: number) {
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }

    function doSelect() {
      const selected = events.find((e) => e.event.eventID === id);
      if (selected) {
        setSnapshot({ ...selected });
      }
      setSelectedId(id);
      setIsDirty(false);
    }

    requestNavigation(doSelect);
  }

  function handleConfirm(id: number) {
    const event = events.find((e) => e.event.eventID === id);
    if (!event) return;

    const { errors: validationErrors, hasErrors } = validateEvent(event);
    if (hasErrors) {
      setErrorMap((prev) => ({ ...prev, [id]: validationErrors }));
      return;
    }

    setErrorMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setIsDirty(false);
    setSnapshot(null);
    setSelectedId(null);
  }

  function handleRemove(id: number) {
    if (selectedId === id) {
      setSelectedId(null);
      setIsDirty(false);
      setSnapshot(null);
    }
    setErrorMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    onRemove(id);
  }

  function handleUpdate(id: number, field: string, value: string | boolean) {
    setIsDirty(true);
    onUpdate(id, field, value);
  }

  function renderEmptyState() {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
          <Inbox size={20} strokeWidth={1.5} />
        </div>
        <p className="text-base text-[var(--text-secondary)]">No events yet.</p>
        <p className="text-sm text-[var(--text-secondary)]">
          Add an event below to get started.
        </p>
      </div>
    );
  }

  function renderNoModulesWarning() {
    return (
      <Alert className="mb-4 border-[var(--border)] bg-[var(--bg-surface)]">
        <AlertCircle size={16} strokeWidth={1.5} />
        <AlertDescription className="text-base text-[var(--text-secondary)]">
          No modules yet.{" "}
          <Button
            type="button"
            variant="ghost"
            onClick={onGoToModules}
            className="h-auto p-0 text-base underline text-[var(--text-primary)] hover:bg-transparent hover:opacity-70 transition-opacity duration-[var(--duration-fast)]"
          >
            Go back to Step 1 to create some.
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  function renderEventRow(event: EventResponse, index: number) {
    const isComplete = isEventComplete(event);
    const isSelected = selectedId === event.event.eventID;
    const errors = errorMap[event.event.eventID];
    const moduleName = getLinkedModuleName(event, modules);
    const criteria = event.event.eventCriteria;

    return (
      <div key={event.event.eventID} className="flex flex-col gap-2">
        {/* summary row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelect(event.event.eventID)}
            className="flex flex-1 items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--bg-elevated)] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-[var(--text-primary)] truncate">
                {criteria?.moduleCode || "Event " + (index + 1)}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                {criteria?.day && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    {criteria.day}
                  </p>
                )}
                {criteria?.startTime && criteria?.endTime && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    {criteria.startTime} - {criteria.endTime}
                  </p>
                )}
                {moduleName && (
                  <p className="text-sm font-mono text-[var(--text-secondary)]">
                    {moduleName}
                  </p>
                )}
              </div>
            </div>
            {isComplete && !isSelected && (
              <CheckCircle
                size={16}
                className="text-[var(--text-secondary)] flex-shrink-0"
                strokeWidth={1.5}
              />
            )}
          </button>

          {/* trash button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemove(event.event.eventID)}
            aria-label={"Remove event " + (index + 1)}
            className="h-10 w-10 flex-shrink-0 border border-[var(--border)] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--error-text)] hover:text-[var(--error-text)] hover:bg-transparent"
          >
            <Trash2 size={16} strokeWidth={1.5} />
          </Button>
        </div>

        {/* inline edit form */}
        {isSelected && (
          <div className="flex flex-col gap-2 pl-2">
            <EventCard
              event={event}
              index={index}
              modules={modules}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
              onGoToModules={onGoToModules}
              errors={errors}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => handleConfirm(event.event.eventID)}
              aria-label="Confirm event"
              className="w-full gap-2 border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--bg-elevated)]"
            >
              <CheckCircle size={16} strokeWidth={1.5} />
              Confirm
            </Button>
          </div>
        )}
      </div>
    );
  }

  function renderAddButton() {
    if (modules.length === 0) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 flex w-full items-center gap-3 rounded-lg border border-dashed border-[var(--border)] px-4 py-4 text-left text-base text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border)]">
          <Plus size={16} strokeWidth={1.5} />
        </span>
        Add event
      </button>
    );
  }

  return (
    <div className="px-8 py-6">
      <AlertDialog open={showGuard} onOpenChange={setShowGuard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you continue, they will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleGuardCancel}>
              Stay
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleGuardConfirm}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Events
        </h2>
        <p className="text-base text-[var(--text-secondary)] mt-1">
          {events.length === 0
            ? "Add the events you want to schedule."
            : events.length +
              " event" +
              (events.length !== 1 ? "s" : "") +
              " added."}
        </p>
      </div>

      {modules.length === 0 && renderNoModulesWarning()}

      <div className="flex flex-col gap-3">
        {events.length === 0 && renderEmptyState()}
        {events.map((event, index) => renderEventRow(event, index))}
      </div>

      {renderAddButton()}
    </div>
  );
}
