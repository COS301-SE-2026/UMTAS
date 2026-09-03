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
  EventCriteria,
  EventResponse,
} from "@/app/builder/utils/events/eventRequestBuilder";
import { Switch } from "@/components/atoms/baseShadcn/switch";
import { Checkbox } from "@/components/atoms/baseShadcn/checkbox";
import { BuildingType } from "../../../../utilities/building/buildingRequestBuilder";

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
  buildings: BuildingType[];
  onUpdate: (
    id: string,
    field: keyof EventResponse | keyof EventCriteria | "buildingId",
    value: string | boolean | string[],
  ) => void;
  onGoToModules?: () => void;
  errors?: EventErrors;
  isAttending?: boolean;
  onAttendanceChange?: (eventId: string, isAttending: boolean) => void;
}

export function EventCard({
  event,
  modules,
  buildings,
  onUpdate,
  onGoToModules,
  errors,
  isAttending = false,
  onAttendanceChange,
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
        value={String(event.eventCriteria?.moduleId)}
        onValueChange={(v) => onUpdate(event.eventId, "moduleId", v)}
      >
        <SelectTrigger
          data-testid="event-Module-Select"
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
    <div
      data-testid="event-card-div"
      className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
    >
      <div className="flex flex-col gap-4 p-4">
        {/* name */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor={"event-name-" + event.eventId}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            Name
          </Label>
          <Input
            data-testid="event-Name-Input"
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

        {/* code */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor={"event-code-" + event.eventId}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            Code
          </Label>
          <Input
            data-testid="event-Code-Input"
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

        {/* venue */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor={"event-venue-" + event.eventId}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            Venue
          </Label>

          <Input
            id={"event-venue-" + event.eventId}
            value={
              typeof event.venues?.[0] === "string"
                ? event.venues[0]
                : event.venues?.[0]?.venueName || ""
            }
            onChange={(e) =>
              onUpdate(event.eventId, "venues", [e.target.value])
            }
            placeholder="e.g. IT 2-26"
            className={getInputClass(!!errors?.venue)}
          />

          {errors?.venue && (
            <p className="text-sm text-[var(--error-text)]">{errors.venue}</p>
          )}
        </div>

        {/* building dropdown */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-[var(--text-secondary)]">
            Building
          </Label>
          <Select
            value={
              (event.eventCriteria as EventCriteria & { buildingId?: string })
                ?.buildingId ||
              (typeof event.venues?.[0] === "object"
                ? event.venues[0].buildingId
                : undefined) ||
              ""
            }
            onValueChange={(value) =>
              onUpdate(event.eventId, "buildingId", value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select the building" />
            </SelectTrigger>
            <SelectContent>
              {buildings.length === 0 ? (
                <SelectItem value="no-buildings" disabled>
                  No buildings available
                </SelectItem>
              ) : (
                buildings.map((building) => (
                  <SelectItem
                    key={building.buildingId}
                    value={building.buildingId}
                  >
                    {building.buildingName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* date - mapped to day */}
        {/* recurring toggle */}
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
            checked={event.isRecurring}
            onCheckedChange={(checked) =>
              onUpdate(event.eventId, "isRecurring", checked)
            }
          />
        </div>

        {/* now date/day of week */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor={"event-date-" + event.eventId}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            {event.isRecurring ? "Day of Week" : "Date"}
          </Label>

          {event.isRecurring ? (
            <Select
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
              data-testid="event-Date-Input"
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
            <p className="text-sm text-[var(--error-text)]">
              {errors.dayOfWeek}
            </p>
          )}
        </div>

        {/* time */}
        <TimeSlotSelect
          value={timeSlotValue}
          onChange={handleTimeChange}
          onRemove={() => {}}
          error={errors?.time}
          hideDaySelect
        />

        <div className="flex items-center p-4 justify-between gap-2 rounded-md border border-[var(--border)]">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium text-[var(--text-primary)]">
              Attendance
            </Label>
            <p className="text-xs text-[var(--text-secondary)]">
              Tick the box if you are planning to attend the event
            </p>
          </div>
          <Checkbox
            data-testid="schedule-Timetable-Checkbox-attending"
            id={`event-${event?.eventId}-attendance`}
            checked={isAttending}
            onCheckedChange={(checked) => {
              if (onAttendanceChange) {
                onAttendanceChange(event.eventId, checked === true);
              }
            }}
          />
        </div>

        {/* event type */}
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
  );
}
