"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  TimeSlotSelect,
  type TimeSlot,
} from "@/components/atoms/builder/TimeSlotSelect";

export interface Module {
  id: string;
  name: string;
  timeSlots: TimeSlot[];
}

interface ModuleCardProps {
  module: Module;
  onRemoveModule: (id: string) => void;
  onAddTimeSlot: (moduleId: string) => void;
  onRemoveTimeSlot: (moduleId: string, slotIndex: number) => void;
  onUpdateTimeSlot: (
    moduleId: string,
    slotIndex: number,
    slot: TimeSlot,
  ) => void;
  slotErrors?: Record<number, string>;
}

export function ModuleCard({
  module,
  onRemoveModule,
  onAddTimeSlot,
  onRemoveTimeSlot,
  onUpdateTimeSlot,
  slotErrors,
}: ModuleCardProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <Badge
          variant="outline"
          className="border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-mono text-xs px-2 py-0.5"
        >
          {module.name}
        </Badge>
        <button
          type="button"
          onClick={() => onRemoveModule(module.id)}
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
          aria-label={`Remove ${module.name}`}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Time slots */}
      <div className="space-y-2 p-3">
        {module.timeSlots.length === 0 && (
          <p className="text-xs text-[var(--text-secondary)] italic">
            No time slots yet — add one below.
          </p>
        )}
        {module.timeSlots.map((slot, idx) => (
          <TimeSlotSelect
            key={idx}
            value={slot}
            onChange={(updated) => onUpdateTimeSlot(module.id, idx, updated)}
            onRemove={() => onRemoveTimeSlot(module.id, idx)}
            error={slotErrors?.[idx]}
          />
        ))}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onAddTimeSlot(module.id)}
          className="mt-1 h-7 gap-1.5 px-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
        >
          <Plus size={12} />
          Add time slot
        </Button>
      </div>
    </div>
  );
}
