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

//NOTE
//copied from event card and changed slightly for customisation
//this was copied and altered to also be used for the solver. will be decoupled
//once I figure out a better way for permissions (admin vs student for example)
// used for tracking editablilty
export interface EventErrors {
  name?: string;
  code?: string;
  date?: string;
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

export function NoPermissionsEventCard({
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
          No modules found.
        </button>
      );
    }

    return (
      <Select
        value={String(event.eventCriteria?.moduleId || "")}
        onValueChange={(v) => onUpdate(event.eventId, "moduleId", v)}
      >
        <SelectTrigger
          className={getInputClass(!!errors?.moduleId) + " w-full"}
        >
          <SelectValue placeholder="Select a module" />
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
    <div className="grid grid-cols-3 gap-4">
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
              id={"event-venue-" + event.eventId}
              value={event.eventCriteria?.venue || ""}
              onChange={(e) => onUpdate(event.eventID, "venue", e.target.value)}
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
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-col gap-4">
          <Label className="text-sm font-medium text-[var(--text-primary)]">
            Date & Time
          </Label>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor={"event-date-" + event.eventId}
              className="text-sm font-medium text-[var(--text-secondary)]"
            >
              Date
            </Label>
            <Input
              id={"event-date-" + event.eventId}
              type="date"
              value={event.eventCriteria?.date || ""}
              onChange={(e) => onUpdate(event.eventId, "date", e.target.value)}
              className={getInputClass(!!errors?.date)}
            />
            {errors?.date && (
              <p className="text-sm text-[var(--error-text)]">{errors.date}</p>
            )}
          </div>

          <TimeSlotSelect
            value={timeSlotValue}
            onChange={handleTimeChange}
            onRemove={() => {}}
            error={errors?.time}
            hideDaySelect
          />
        </div>
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
