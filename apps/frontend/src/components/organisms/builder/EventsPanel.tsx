"use client";

import React, { useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { PanelHeader } from "@/components/atoms/builder/PanelHeader";
import { StepPill } from "@/components/atoms/builder/StepPill";
import type { BuilderEvent } from "@/components/molecules/builder/EventCard";
import type { EventType } from "@/components/atoms/builder/eventDropdown";

interface EventsPanelProps {
  events: BuilderEvent[];
  onClose: () => void;
  onAdd: () => void;
  selectedEventId: string | null;
  onEventSelect: (id: string) => void;
}

function generateId(): string {
  const crypto = window.crypto;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);

  return array[0].toString();
}

export function emptyEvent(): BuilderEvent {
  return {
    id: generateId(),
    name: "",
    code: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "lecture" as EventType,
    moduleId: "",
  };
}

export function EventsPanel({
  events,
  onClose,
  onAdd,
  selectedEventId,
  onEventSelect,
}: EventsPanelProps) {
  function renderEmptyState() {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
          <Plus size={18} />
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          No events added yet...
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          Click the button below to add an event.
        </p>
      </div>
    );
  }

  function renderEventPills() {
    return (
      <div className="space-y-1">
        {events.map((event, index) => (
          <StepPill
            key={event.id}
            icon={<CalendarDays size={15} />}
            label={event.name || "Event " + (index + 1)}
            summary={event.date || undefined}
            isActive={selectedEventId === event.id}
            isComplete={!!(event.type && event.moduleId)}
            onClick={() => onEventSelect(event.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PanelHeader title="Events" onClose={onClose} />

      {/* event counter */}
      <div className="px-3 py-2 border-b border-[var(--border)]">
        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {events.length === 0 ? renderEmptyState() : renderEventPills()}

        {/* add event pill at the bottom */}
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left border border-dashed border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border)]">
            <Plus size={15} />
          </span>
          Add event
        </button>
      </div>
    </div>
  );
}
