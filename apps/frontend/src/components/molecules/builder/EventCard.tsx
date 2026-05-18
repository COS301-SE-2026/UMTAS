"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Button } from "@/components/atoms/baseShadcn/button";
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
import { PanelHeader } from "@/components/atoms/builder/PanelHeader";
import { type Module } from "@/components/molecules/builder/ModuleCard";

export interface BuilderEvent {
  id: string;
  name: string;
  code: string;
  date: string;
  startTime: string;
  endTime: string;
  type: EventType;
  moduleId: string;
}

export interface EventErrors {
  name?: string;
  code?: string;
  date?: string;
  time?: string;
}

interface EventCardProps {
  event: BuilderEvent;
  index: number;
  modules: Module[];
  onUpdate: (
    id: string,
    field: keyof Omit<BuilderEvent, "id">,
    value: string,
  ) => void;
  onRemove: (id: string) => void;
  onContinue: () => void;
  errors?: EventErrors;
}

export function EventCard({
  event,
  index,
  modules,
  onUpdate,
  onRemove,
  onContinue,
  errors,
}: EventCardProps) {
  const inputClass =
    "h-9 bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)] " +
    "placeholder:text-[var(--text-secondary)] focus-visible:ring-1 focus-visible:ring-[var(--text-primary)] text-sm";

  const timeSlotValue: TimeSlot = {
    day: "",
    startTime: event.startTime,
    endTime: event.endTime,
  };

  function handleTimeChange(slot: TimeSlot) {
    onUpdate(event.id, "startTime", slot.startTime);
    onUpdate(event.id, "endTime", slot.endTime);
  }

  function getInputClass(hasError: boolean) {
    if (hasError) {
      return inputClass + " border-red-500";
    }
    return inputClass;
  }

  function isContinueDisabled() {
    if (!event.type) return true;
    if (!event.name) return true;
    if (!event.code) return true;
    if (!event.date) return true;
    if (!event.startTime) return true;
    if (!event.endTime) return true;
    if (!event.moduleId) return true;
    return false;
  }

  function renderModuleField() {
    if (modules.length === 0) {
      return (
        <p className="text-xs text-[var(--text-secondary)]">
          No modules yet — create some in the Modules step first.
        </p>
      );
    }

    return (
      <Select
        value={event.moduleId}
        onValueChange={(v) => onUpdate(event.id, "moduleId", v)}
      >
        <SelectTrigger className={getInputClass(false) + " w-full"}>
          <SelectValue placeholder="Select a module" />
        </SelectTrigger>
        <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)]">
          {modules.map((m) => {
            let label = m.name;
            if (m.code) {
              label = m.code + " - " + m.name;
            }
            return (
              <SelectItem
                key={m.id}
                value={m.id}
                className="text-xs text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
              >
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        title={event.name || "Event " + (index + 1)}
        onClose={() => onRemove(event.id)}
      />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {/* name */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={"event-name-" + event.id}
              className="text-xs font-medium text-[var(--text-secondary)]"
            >
              Name
            </Label>
            <Input
              id={"event-name-" + event.id}
              value={event.name}
              onChange={(e) => onUpdate(event.id, "name", e.target.value)}
              placeholder="e.g. COS301 Lecture Group A"
              className={getInputClass(!!errors?.name)}
            />
            {errors?.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* code */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={"event-code-" + event.id}
              className="text-xs font-medium text-[var(--text-secondary)]"
            >
              Code
            </Label>
            <Input
              id={"event-code-" + event.id}
              value={event.code}
              onChange={(e) => onUpdate(event.id, "code", e.target.value)}
              placeholder="e.g. COS301-LEC-A"
              maxLength={20}
              className={getInputClass(!!errors?.code)}
            />
            {errors?.code && (
              <p className="text-xs text-red-500">{errors.code}</p>
            )}
          </div>

          {/* date */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={"event-date-" + event.id}
              className="text-xs font-medium text-[var(--text-secondary)]"
            >
              Date
            </Label>
            <Input
              id={"event-date-" + event.id}
              type="date"
              value={event.date}
              onChange={(e) => onUpdate(event.id, "date", e.target.value)}
              className={getInputClass(!!errors?.date)}
            />
            {errors?.date && (
              <p className="text-xs text-red-500">{errors.date}</p>
            )}
          </div>

          {/* time */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[var(--text-secondary)]">
              Time
            </Label>
            <TimeSlotSelect
              value={timeSlotValue}
              onChange={handleTimeChange}
              onRemove={() => {}}
              error={errors?.time}
              hideDaySelect
            />
          </div>

          {/* event type */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[var(--text-secondary)]">
              Event Type
            </Label>
            <EventTypeDropdown
              value={event.type}
              onChange={(v) => onUpdate(event.id, "type", v)}
            />
          </div>

          {/* module assignment */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[var(--text-secondary)]">
              Module
            </Label>
            {renderModuleField()}
          </div>

          {/* continue */}
          <Button
            type="button"
            size="sm"
            disabled={isContinueDisabled()}
            onClick={onContinue}
            className="h-9 w-full text-xs bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
