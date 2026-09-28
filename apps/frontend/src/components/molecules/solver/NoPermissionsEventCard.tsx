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
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import {
  EventResponse,
  EventCriteria,
} from "@/app/builder/utils/events/eventRequestBuilder";

export interface EventErrors {
  name?: string;
  code?: string;
  date?: string;
  time?: string;
  moduleId?: string;
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

  const cardClass =
    "h-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4";

  const cardContentClass = "flex h-full flex-col gap-4";

  const titleClass = "text-sm font-semibold text-[var(--text-primary)]";

  const labelClass = "text-sm text-[var(--text-secondary)]";

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
          className="text-left text-sm text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
        >
          No modules found.
        </button>
      );
    }

    return (
      <Select
        value={String(event.eventCriteria?.moduleId || "")}
        onValueChange={(value) => onUpdate(event.eventId, "moduleId", value)}
      >
        <SelectTrigger
          className={getInputClass(!!errors?.moduleId) + " w-full"}
        >
          <SelectValue placeholder="Select a Module" />
        </SelectTrigger>

        <SelectContent className="border-[var(--border)] bg-[var(--bg-surface)]">
          {modules.map((module) => {
            let label = module.moduleName;

            if (module.moduleCode) {
              label = module.moduleCode + " - " + module.moduleName;
            }

            return (
              <SelectItem
                key={module.moduleID}
                value={String(module.moduleID)}
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
        <Label className={labelClass}>Module</Label>

        {renderModuleField()}

        {errors?.moduleId && (
          <p className="text-sm text-[var(--error-text)]">{errors.moduleId}</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className={cardClass}>
        <div className={cardContentClass}>
          <Label className={titleClass}>General</Label>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor={"event-name-" + event.eventId}
              className={labelClass}
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
              className={labelClass}
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
        </div>
      </div>

      <div className={cardClass}>
        <div className={cardContentClass}>
          <Label className={titleClass}>Date & Time</Label>

          {event.eventCriteria?.date && (
            <div className="flex flex-col gap-2">
              <Label
                htmlFor={"event-date-" + event.eventId}
                className={labelClass}
              >
                Date
              </Label>

              <Input
                id={"event-date-" + event.eventId}
                type="date"
                value={event.eventCriteria.date || ""}
                onChange={(e) =>
                  onUpdate(event.eventId, "date", e.target.value)
                }
                className={getInputClass(!!errors?.date)}
              />
            </div>
          )}

          {event.eventCriteria?.dayOfWeek && (
            <div className="flex flex-col gap-2">
              <Label
                htmlFor={"event-day-" + event.eventId}
                className={labelClass}
              >
                Day
              </Label>

              <Input
                id={"event-day-" + event.eventId}
                value={event.eventCriteria.dayOfWeek}
                onChange={(e) =>
                  onUpdate(event.eventId, "dayOfWeek", e.target.value)
                }
                className={inputClass}
              />
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor={"event-start-time-" + event.eventId}
                className={labelClass}
              >
                Start Time
              </Label>

              <Input
                id={"event-start-time-" + event.eventId}
                type="time"
                value={event.eventCriteria?.startTime || ""}
                onChange={(e) =>
                  onUpdate(event.eventId, "startTime", e.target.value)
                }
                className={getInputClass(!!errors?.time)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor={"event-end-time-" + event.eventId}
                className={labelClass}
              >
                End Time
              </Label>

              <Input
                id={"event-end-time-" + event.eventId}
                type="time"
                value={event.eventCriteria?.endTime || ""}
                onChange={(e) =>
                  onUpdate(event.eventId, "endTime", e.target.value)
                }
                className={getInputClass(!!errors?.time)}
              />
            </div>
          </div>

          {errors?.date && (
            <p className="text-sm text-[var(--error-text)]">{errors.date}</p>
          )}

          {errors?.time && (
            <p className="text-sm text-[var(--error-text)]">{errors.time}</p>
          )}
        </div>
      </div>

      <div className={cardClass}>
        <div className={cardContentClass}>
          <Label className={titleClass}>Event Type / Module</Label>

          <div className="flex flex-col gap-2">
            <Label className={labelClass}>Event Type</Label>

            <Input
              value={event.activityType || ""}
              onChange={(e) =>
                onUpdate(event.eventId, "activityType", e.target.value)
              }
              className={inputClass}
            />
          </div>

          {renderModuleSection()}
        </div>
      </div>
    </div>
  );
}
