"use client";

import { Plus, CalendarDays } from "lucide-react";
import { PanelHeader } from "@/components/atoms/builder/PanelHeader";
import { StepPill } from "@/components/atoms/builder/StepPill";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";

interface EventsPanelProps {
  events: EventResponse[];
  onClose: () => void;
  onAdd: () => void;
  selectedEventId: number | null;
  onEventSelect: (id: number) => void;
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
        {events.map((event, index) => {
          const criteria = event.event.eventCriteria;
          return (
            <StepPill
              key={event.event.eventID}
              icon={<CalendarDays size={15} />}
              label={criteria?.moduleCode || "Event " + (index + 1)}
              summary={criteria?.day || undefined}
              isActive={selectedEventId === event.event.eventID}
              isComplete={!!(criteria?.type && event.lecture?.moduleID)}
              onClick={() => onEventSelect(event.event.eventID)}
            />
          );
        })}
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
