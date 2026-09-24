"use client";

import { AlertCircle } from "lucide-react";
import { Alert } from "@/components/atoms/baseShadcn/alert";
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
    <Alert className="mt-5 flex flex-wrap items-center gap-3 border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 md:gap-6">
      <div className="flex min-w-[15rem] flex-1 items-center gap-2">
        <AlertCircle
          size={16}
          className="shrink-0 text-[var(--warning-text)]"
          aria-hidden="true"
        />
        <p className="font-medium text-[var(--text-primary)]">
          {slots.length} classes overlap now
        </p>
      </div>

      <div className="grid min-w-[16rem] flex-1 gap-1 sm:max-w-[29rem]">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          Class for attendance
        </span>
        <Select
          value=""
          onValueChange={(slotId) => {
            const slot = slots.find((candidate) => candidate.id === slotId);
            if (slot) onSelect(slot);
          }}
          disabled={busy}
        >
          <SelectTrigger
            className="h-9 w-full"
            aria-label="Class for attendance"
          >
            <SelectValue placeholder="Choose a class…" />
          </SelectTrigger>
          <SelectContent position="popper" align="end">
            {slots.map((slot) => (
              <SelectItem key={slot.id} value={slot.id}>
                {slot.moduleCode} · {slot.moduleName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Alert>
  );
}
