"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle,
  Inbox,
  AlertCircle,
  AwardIcon,
  ArrowUpWideNarrow,
} from "lucide-react";
import {
  EventCard,
  type EventErrors,
} from "@/components/molecules/builder/EventCard";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import {
  EventCriteria,
  EventResponse,
} from "@/app/builder/utils/events/eventRequestBuilder";
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
import {
  addUniEventMut,
  getAllEventsQ,
  removeEventMut,
  updateEventMut,
} from "@/components/templates/builder/Queries/eventQueries";
import { useMutation } from "@tanstack/react-query";
import { getQueryClient } from "@/components/tanstack/getQueryClient";

import Tutorial from "@/components/organisms/nav/Tutorial";

const baseSteps = [
  {
    target: "#btn-add-new-event",
    content: "Add a new event to the list.",
  },
  {
    target: "#next-button",
    content: "Click here to go to the schedules page to create your timetable.",
  },
];

const extendedSteps = [
  {
    target: "#btn-modify-event",
    content: "Edit the selected event.",
  },
  {
    target: "#btn-delete-event",
    content: "Remove the selected event.",
  },
];

interface EventsStepProps {
  events: EventResponse[];
  modules: ModuleResponseDto[];
  onGoToModules: () => void;
}
interface valEvent {
  errors: EventErrors;
  hasErrors: boolean;
}

function validateEvent(event: EventResponse): valEvent {
  const errors: EventErrors = {};
  let hasErrors = false;

  const criteria = event.eventCriteria;

  if (!event.eventName?.trim()) {
    errors.name = "Name is required";
    hasErrors = true;
  }
  if (!event.activityCode?.trim()) {
    errors.code = "Code is required";
    hasErrors = true;
  }

  //conditional validation based on isRecurring
  if (event.isRecurring) {
    if (!criteria?.dayOfWeek) {
      errors.dayOfWeek = "Day of week is required for recurring events";
      hasErrors = true;
    }
  } else {
    if (!criteria?.date) {
      errors.date = "Date is required for non-recurring events";
      hasErrors = true;
    }
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

  return { errors, hasErrors };
}

function isEventComplete(event: EventResponse) {
  const criteria = event.eventCriteria;
  if (!event.eventName) return false;
  if (!event.activityCode) return false;
  if (!criteria?.startTime) return false;
  if (!criteria?.endTime) return false;

  if (event.isRecurring) {
    if (!criteria?.dayOfWeek) return false;
  } else {
    if (!criteria?.date) return false;
  }
  if (criteria?.eventSource === "university")
    // TODO add module && event.eventCriteria.moduleID)
    return false;

  return true;
}

function getLinkedModuleName(
  event: EventResponse,
  modules: ModuleResponseDto[],
) {
  const found = modules.find(
    (m) => m.moduleID === event.eventCriteria.moduleId,
  ); // TODO add module event.lecture?.moduleID);
  if (found) {
    return found.moduleCode + " - " + found.moduleName;
  }
  return null;
}

export function EventsStep({
  events,
  modules,
  onGoToModules,
}: EventsStepProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errorMap, setErrorMap] = useState<Record<string, EventErrors>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showGuard, setShowGuard] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const steps =
    events.length > 0 ? [...extendedSteps, ...baseSteps] : baseSteps;

  const addEvent = useMutation(addUniEventMut());
  const deleteEvent = useMutation(removeEventMut());
  const updateEvent = useMutation(updateEventMut());

  // a local construct to add an empty event
  function addNewEvent() {
    addEvent.mutate({
      body: {
        activityCode: "L1",
        isRecurring: false,
        eventName: "Name",
        activityType: "lecture",
        eventCriteria: {
          eventSource: "university",
          date: new Date().toISOString().split("T")[0],
          startTime: "07:00",
          endTime: "07:30",
          moduleId: modules[0].moduleID,
        },
        validated: true,
      },
    });
  }

  function requestNavigation(action: () => void) {
    if (isDirty) {
      setPendingAction(() => action);
      setShowGuard(true);
      return;
    }
    action();
  }

  function handleGuardConfirm() {
    /*
    if (snapshot) {
      const id = snapshot.event.eventID;
      const crit = snapshot.event.eventCriteria;
      onUpdate(id, "name", snapshot.event.name || "");
      onUpdate(id, "code", snapshot.event.code || "");
      onUpdate(id, "date", crit?.day || "");
      onUpdate(id, "startTime", crit?.startTime || "");
      onUpdate(id, "endTime", crit?.endTime || "");
      onUpdate(id, "type", crit?.type || "lecture");
      onUpdate(id, "moduleId", String(snapshot.lecture?.moduleID || ""));
    }*/
    setIsDirty(false);
    setShowGuard(false);
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
      const selected = events.find((e) => e.eventId === id);
      setSelectedId(id);
      setIsDirty(false);
    }

    requestNavigation(doSelect);
  }

  async function handleConfirm(id: string) {
    const event = events.find((e) => e.eventId === id);
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

    const cleanCriteria = { ...event.eventCriteria };

    if (event.isRecurring) {
      delete cleanCriteria.date;
    } else {
      delete cleanCriteria.dayOfWeek;
    }

    updateEvent.mutate({
      body: {
        isRecurring: event.isRecurring,
        activityType: event.activityType,
        activityCode: event.activityCode,
        eventCriteria: cleanCriteria,
        eventName: event.eventName,
      },
      path: {
        id: id,
      },
    });

    setIsDirty(false);
    setSelectedId(null);
  }

  function handleRemove(id: string) {
    if (selectedId === id) {
      setSelectedId(null);
      setIsDirty(false);
    }
    setErrorMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (!id.startsWith("TEMP")) {
      deleteEvent.mutate(id);
    }
    getQueryClient().setQueryData(
      getAllEventsQ().queryKey,
      (OldEvents: EventResponse[] | undefined) => {
        if (!OldEvents) return [];
        return OldEvents.filter((e) => e.eventId !== id);
      },
    );
  }

  function handleUpdate(
    id: string,
    field: keyof EventResponse | keyof EventCriteria,
    value: string | boolean,
  ) {
    setIsDirty(true);
    getQueryClient().setQueryData(
      getAllEventsQ().queryKey,
      (oldEvents: EventResponse[] | undefined) => {
        if (!oldEvents) return [];

        return oldEvents.map((event) =>
          event.eventId === id
            ? {
                ...event,
                ...(field in event
                  ? { [field]: value }
                  : {
                      eventCriteria: { ...event.eventCriteria, [field]: value },
                    }),
              }
            : event,
        );
      },
    );
  }

  function renderEmptyState() {
    return (
      <div className="flex flex-col items-center gap-3 py-32 text-center">
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
    const isSelected = selectedId === event.eventId;
    const errors = errorMap[event.eventId];
    const moduleName = getLinkedModuleName(event, modules);
    const criteria = event.eventCriteria;

    return (
      <div key={event.eventId} className="flex flex-col gap-2">
        {/* summary row */}
        <div className="flex items-center gap-2">
          <button
            data-testid="event-open-btn"
            id="btn-modify-event"
            type="button"
            onClick={() => handleSelect(event.eventId)}
            className="flex flex-1 items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--bg-elevated)] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-[var(--text-primary)] truncate">
                {event.eventName || "Event " + (index + 1)}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                {event.activityCode && (
                  <p className="text-sm font-mono text-[var(--text-secondary)]">
                    {event.activityCode}
                  </p>
                )}
                {criteria?.date && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    {criteria.date}
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
            id="btn-delete-event"
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemove(event.eventId)}
            aria-label={"Remove event " + (index + 1)}
            className="h-10 w-10 flex-shrink-0 border border-[var(--error-text)] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--error-text)] hover:text-[var(--error-text)] hover:bg-[var(--error-bg)]"
          >
            <Trash2
              size={16}
              strokeWidth={1.5}
              className="text-[var(--error-text)]"
            />
          </Button>
        </div>

        {/* inline edit form */}
        {isSelected && (
          <div className="flex flex-col gap-2 pl-2">
            <EventCard
              event={event}
              modules={modules}
              onUpdate={handleUpdate}
              onGoToModules={onGoToModules}
              errors={errors}
            />

            <Button
              data-testid="event-Confirm-Btn"
              type="button"
              variant="outline"
              onClick={() => handleConfirm(event.eventId)}
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
        data-testid="event-add-btn"
        id="btn-add-new-event"
        type="button"
        onClick={addNewEvent} // adds an event card
        className="flex w-fit items-center gap-3 rounded-lg border border-dashed border-[var(--border)] px-2 py-2 text-left text-base text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border)]">
          <Plus size={16} strokeWidth={1.5} />
        </span>
        Add Event
      </button>
    );
  }

  return (
    <div className="px-8 py-6">
      <Tutorial steps={steps} wait={true} />
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

      <div className="flex flex-row items-center justify-between mb-5">
        <div>
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
        {renderAddButton()}
      </div>

      {modules.length === 0 && renderNoModulesWarning()}

      <div data-testid="builder-event-div" className="flex flex-col gap-3">
        {events.length === 0 && renderEmptyState()}
        {events.map((event, index) => renderEventRow(event, index))}
      </div>
    </div>
  );
}
