"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import type { AttendanceSlot } from "@/lib/nfc_attendance/types";

export function AttendanceConflictSelector({
  slots,
  busy,
  onSelect,
}: {
  slots: AttendanceSlot[];
  busy: boolean;
  onSelect: (slot: AttendanceSlot) => void;
}) {
  return (
    <div className="mt-5 space-y-4 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Choose your class
        </h3>

        <p className="text-sm text-[var(--text-secondary)]">
          {slots.length} classes are happening at the same time. Select the
          class you are attending to record your attendance.
        </p>
      </div>

      <div className="grid gap-2 sm:max-w-md">
        <label
          htmlFor="attendance-current-class"
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          Current class
        </label>

        <Select
          value=""
          onValueChange={(slotId) => {
            const slot = slots.find((candidate) => candidate.id === slotId);

            if (slot) {
              onSelect(slot);
            }
          }}
          disabled={busy}
        >
          <SelectTrigger
            id="attendance-current-class"
            className="h-9 w-full border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
          >
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>

          <SelectContent
            position="popper"
            align="start"
            className="w-[var(--radix-select-trigger-width)] border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
          >
            {slots.map((slot) => (
              <SelectItem key={slot.id} value={slot.id}>
                <span className="whitespace-normal break-words">
                  {slot.moduleCode} · {slot.moduleName}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
