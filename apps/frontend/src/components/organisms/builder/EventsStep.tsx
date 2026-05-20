"use client";

import React, { useState } from "react";
import { Plus, Trash2, CheckCircle, Inbox, AlertCircle } from "lucide-react";
import {
  EventCard,
  type BuilderEvent,
  type EventErrors,
} from "@/components/molecules/builder/EventCard";
import type { Module } from "@/components/molecules/builder/ModuleCard";
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
  events: BuilderEvent[];
  modules: Module[];
  onAdd: () => void;
  onUpdate: (
    id: string,
    field: keyof Omit<BuilderEvent, "id">,
    value: string,
  ) => void;
  onRemove: (id: string) => void;
  onGoToModules: () => void;
}

function validateEvent(event: BuilderEvent): {
  errors: EventErrors;
  hasErrors: boolean;
} {
  const errors: EventErrors = {};
  let hasErrors = false;

  if (!event.name.trim()) {
    errors.name = "Name is required";
    hasErrors = true;
  }
  if (!event.code.trim()) {
    errors.code = "Code is required";
    hasErrors = true;
  }
  if (!event.date) {
    errors.date = "Date is required";
    hasErrors = true;
  }
  if (!event.startTime || !event.endTime) {
    errors.time = "Start and end time are required";
    hasErrors = true;
  }
  if (event.startTime && event.endTime && event.startTime >= event.endTime) {
    errors.time = "Start time must be before end time";
    hasErrors = true;
  }
  if (event.type === "lecture" && !event.moduleId) {
    errors.moduleId = "A module must be assigned to a lecture";
    hasErrors = true;
  }

  return { errors, hasErrors };
}

function isEventComplete(event: BuilderEvent) {
  if (!event.name) return false;
  if (!event.code) return false;
  if (!event.date) return false;
  if (!event.startTime) return false;
  if (!event.endTime) return false;
  if (event.type === "lecture" && !event.moduleId) return false;
  return true;
}

function getLinkedModuleName(event: BuilderEvent, modules: Module[]) {
  const found = modules.find((m) => m.id === event.moduleId);
  if (found) {
    return found.code + " - " + found.name;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errorMap, setErrorMap] = useState<Record<string, EventErrors>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showGuard, setShowGuard] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [snapshot, setSnapshot] = useState<BuilderEvent | null>(null);

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
      onUpdate(snapshot.id, "name", snapshot.name);
      onUpdate(snapshot.id, "code", snapshot.code);
      onUpdate(snapshot.id, "date", snapshot.date);
      onUpdate(snapshot.id, "startTime", snapshot.startTime);
      onUpdate(snapshot.id, "endTime", snapshot.endTime);
      onUpdate(snapshot.id, "type", snapshot.type);
      onUpdate(snapshot.id, "moduleId", snapshot.moduleId);
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

  function handleSelect(id: string) {
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }

    function doSelect() {
      const selected = events.find((e) => e.id === id);
      if (selected) {
        setSnapshot({ ...selected });
      }
      setSelectedId(id);
      setIsDirty(false);
    }

    requestNavigation(doSelect);
  }

  function handleConfirm(id: string) {
    const event = events.find((e) => e.id === id);
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

  function handleRemove(id: string) {
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

  function handleUpdate(
    id: string,
    field: keyof Omit<BuilderEvent, "id">,
    value: string,
  ) {
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

  function renderEventRow(event: BuilderEvent, index: number) {
    const isComplete = isEventComplete(event);
    const isSelected = selectedId === event.id;
    const errors = errorMap[event.id];
    const moduleName = getLinkedModuleName(event, modules);

    return (
      <div key={event.id} className="flex flex-col gap-2">
        {/* summary row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelect(event.id)}
            className="flex flex-1 items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--bg-elevated)] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-[var(--text-primary)] truncate">
                {event.name || "Event " + (index + 1)}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                {event.date && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    {event.date}
                  </p>
                )}
                {event.startTime && event.endTime && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    {event.startTime} - {event.endTime}
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
            onClick={() => handleRemove(event.id)}
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
              onClick={() => handleConfirm(event.id)}
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
