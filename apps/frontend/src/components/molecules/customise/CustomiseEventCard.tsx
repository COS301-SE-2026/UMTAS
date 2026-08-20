"use client";

import React from "react";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { TimeSlotSelect } from "@/components/atoms/builder/TimeSlotSelect";
import type { TimeSlot } from "@/components/atoms/builder/TimeSlotSelect";
import { EventTypeDropdown } from "@/components/atoms/builder/eventDropdown";
import type { EventType } from "@/components/atoms/builder/eventDropdown";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import {
  EventResponse,
  EventCriteria,
} from "@/app/builder/utils/events/eventRequestBuilder";
import { UserDetails } from "@/lib/userclass/userClass";
import { Switch } from "@/components/atoms/baseShadcn/switch";

//NOTE
//copied from event card and changed slightly for customisation
// used for tracking editablilty
const canEdit = UserDetails.userCanEdit();
export interface EventErrors {
  name?: string;
  code?: string;
  date?: string;
  dayOfWeek?: string;
  time?: string;
  moduleId?: string;
  venue?: string;
}

interface EventCardProps {
  event: EventResponse;
  modules: ModuleResponseDto[];
  onUpdate: (
    id: string,
    field: keyof EventResponse | keyof EventCriteria,
    value: string | boolean,
  ) => void;
  onGoToModules?: () => void;
  errors?: EventErrors;
}

export function CustomiseEventCard({
  event,
  modules,
  onUpdate,
  onGoToModules,
  errors,
}: EventCardProps) {
  const inputClass =
    "h-10 bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)] " +
    "placeholder:text-[var(--text-disabled)] focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "focus-visible:ring-[var(--ring)] text-sm";

  const timeSlotValue: TimeSlot = {
    day: "",
    startTime: event.eventCriteria?.startTime || "",
    endTime: event.eventCriteria?.endTime || "",
  };

  function handleTimeChange(slot: TimeSlot) {
    onUpdate(event.eventId, "startTime", slot.startTime);
    onUpdate(event.eventId, "endTime", slot.endTime);
  }

  function getInputClass(hasError: boolean) {
    if (hasError) {
      return inputClass + " border-[var(--error-text)]";
    }
    return inputClass;
  }

  function renderModuleField() {
    if (modules.length === 0) {
      return (
        <button
          type="button"
          onClick={onGoToModules}
          className="text-sm underline text-[var(--text-secondary)] text-left transition-colors duration-[var(--duration-fast)] hover:text-[var(--text-primary)]"
        >
          No modules yet, go back to Step 1 to create some.
        </button>
      );
    }

    return (
      <Select
        value={String(event.eventCriteria?.moduleId || "")}
        onValueChange={(v) => onUpdate(event.eventId, "moduleId", v)}
        disabled={!canEdit}
      >
        <SelectTrigger
          className={getInputClass(!!errors?.moduleId) + " w-full"}
        >
          <SelectValue placeholder="Select a Module" />
        </SelectTrigger>
        <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)]">
          {modules.map((m) => {
            let label = m.moduleName;
            if (m.moduleCode) {
              label = m.moduleCode + " - " + m.moduleName;
            }
            return (
              <SelectItem
                key={m.moduleID}
                value={String(m.moduleID)}
                className="text-sm text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
              >
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  function renderModuleSection() {
    if (event.eventCriteria?.eventSource !== "university") {
      return null;
    }

    return (
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-[var(--text-secondary)]">
          Module
        </Label>
        {renderModuleField()}
        {errors?.moduleId && (
          <p className="text-sm text-[var(--error-text)]">{errors.moduleId}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/*name, code en venue*/}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-col gap-4">
          <Label className="text-sm font-medium text-[var(--text-primary)]">
            General
          </Label>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor={"event-name-" + event.eventId}
              className="text-sm font-medium text-[var(--text-secondary)]"
            >
              Name
            </Label>
            <Input
              readOnly={!canEdit}
              id={"event-name-" + event.eventId}
              value={event.eventName || ""}
              onChange={(e) =>
                onUpdate(event.eventId, "eventName", e.target.value)
              }
              placeholder="e.g. COS301 Lecture Group A"
              className={getInputClass(!!errors?.name)}
            />
            {errors?.name && (
              <p className="text-sm text-[var(--error-text)]">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor={"event-code-" + event.eventId}
              className="text-sm font-medium text-[var(--text-secondary)]"
            >
              Code
            </Label>
            <Input
              readOnly={!canEdit}
              id={"event-code-" + event.eventId}
              value={event.activityCode || ""}
              onChange={(e) =>
                onUpdate(event.eventId, "activityCode", e.target.value)
              }
              placeholder="e.g. COS301-LEC-A"
              maxLength={20}
              className={getInputClass(!!errors?.code)}
            />
            {errors?.code && (
              <p className="text-sm text-[var(--error-text)]">{errors.code}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor={"event-venue-" + event.eventId}
              className="text-sm font-medium text-[var(--text-secondary)]"
            >
              Venue
            </Label>
            {/* <Input
              readOnly={!canEdit}
              id={"event-venue-" + event.eventId}
              value={event.eventCriteria?.venue || ""}
              onChange={(e) => onUpdate(event.eventId, "venue", e.target.value)}
              placeholder="e.g. IT 2-26"
              className={getInputClass(!!errors?.venue)}
            />
            {errors?.venue && (
              <p className="text-sm text-[var(--error-text)]">{errors.venue}</p>
            )} */}
          </div>
        </div>
      </div>

      {/*date and time*/}
      {/* isRecurring */}
      <div className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] p-3">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium text-[var(--text-primary)]">
            Recurring Weekly
          </Label>
          <p className="text-xs text-[var(--text-secondary)]">
            Does this event repeat every week?
          </p>
        </div>
        <Switch
          disabled={!canEdit}
          checked={event.isRecurring}
          onCheckedChange={(checked) =>
            onUpdate(event.eventId, "isRecurring", checked)
          }
        />
      </div>

      {/* date/day of week */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor={"event-date-" + event.eventId}
          className="text-sm font-medium text-[var(--text-secondary)]"
        >
          {event.isRecurring ? "Day of Week" : "Date"}
        </Label>
        {event.isRecurring ? (
          <Select
            disabled={!canEdit}
            value={event.eventCriteria?.dayOfWeek || ""}
            onValueChange={(v) => onUpdate(event.eventId, "dayOfWeek", v)}
          >
            <SelectTrigger className={getInputClass(!!errors?.dayOfWeek)}>
              <SelectValue placeholder="Select a Day" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)]">
              {[
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ].map((day) => (
                <SelectItem
                  key={day}
                  value={day}
                  className="capitalize text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
                >
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            readOnly={!canEdit}
            id={"event-date-" + event.eventId}
            type="date"
            value={event.eventCriteria?.date || ""}
            onChange={(e) => onUpdate(event.eventId, "date", e.target.value)}
            className={getInputClass(!!errors?.date)}
          />
        )}

        {errors?.date && !event.isRecurring && (
          <p className="text-sm text-[var(--error-text)]">{errors.date}</p>
        )}
        {errors?.dayOfWeek && event.isRecurring && (
          <p className="text-sm text-[var(--error-text)]">{errors.dayOfWeek}</p>
        )}
      </div>

      {/*event type and module*/}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-col gap-4">
          <Label className="text-sm font-medium text-[var(--text-primary)]">
            Event Type / Module Assignment
          </Label>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-[var(--text-secondary)]">
              Event type
            </Label>
            <EventTypeDropdown
              disabled={!canEdit}
              value={(event.activityType as EventType) || "lecture"}
              onChange={(v) => onUpdate(event.eventId, "activityType", v)}
            />
          </div>

          {renderModuleSection()}
        </div>
      </div>
    </div>
  );
}
