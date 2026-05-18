"use client";

import React from "react";
import { Trash2 } from "lucide-react";
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
import type { Module } from "@/components/molecules/builder/ModuleCard";
import type { EventType } from "@/components/atoms/builder/eventDropdown";

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
  moduleId?: string;
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
  errors?: EventErrors;
}

export function EventCard({
  event,
  index,
  modules,
  onUpdate,
  onRemove,
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

  function renderModuleField() {
    if (modules.length === 0) {
      return (
        <div
          className={
            inputClass +
            " flex items-center rounded-md border px-3 text-[var(--text-secondary)] opacity-60 cursor-not-allowed"
          }
        >
          No modules, create one first
        </div>
      );
    }

    return (
      <Select
        value={event.moduleId}
        onValueChange={(v) => onUpdate(event.id, "moduleId", v)}
      >
        <SelectTrigger
          className={getInputClass(!!errors?.moduleId) + " w-full"}
        >
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

  function renderHeaderCode() {
    if (event.code) {
      return (
        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
          · {event.code}
        </span>
      );
    }
    return null;
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      {/* header */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)]"
        style={{ borderLeftWidth: "3px", borderLeftColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Event {index + 1}
          </span>
          {renderHeaderCode()}
        </div>
        <button
          type="button"
          onClick={() => onRemove(event.id)}
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
          aria-label={"Remove event " + (index + 1)}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* fields */}
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
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

        {/* module assignment */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-[var(--text-secondary)]">
            Module
          </Label>
          {renderModuleField()}
          {errors?.moduleId && (
            <p className="text-xs text-red-500">{errors.moduleId}</p>
          )}
        </div>

        {/* time */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
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
      </div>
    </div>
  );
}
