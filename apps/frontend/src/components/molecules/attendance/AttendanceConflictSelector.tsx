"use client";

import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/atoms/baseShadcn/alert";
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
    <Alert className="mt-5 border-[var(--border)] bg-[var(--bg-base)]">
      <AlertCircle size={16} aria-hidden="true" />

      <AlertTitle>Choose the class you are attending</AlertTitle>

      <AlertDescription className="space-y-4">
        <p>
          {slots.length} classes are happening at the same time. Attendance will
          be recorded against the class you select.
        </p>

        <div className="grid gap-2 sm:max-w-md">
          <span className="text-xs font-medium text-[var(--text-primary)]">
            Current class
          </span>

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
            <SelectTrigger className="h-9 w-full" aria-label="Current class">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>

            <SelectContent position="popper" align="start">
              {slots.map((slot) => (
                <SelectItem key={slot.id} value={slot.id}>
                  {slot.moduleCode} · {slot.moduleName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </AlertDescription>
    </Alert>
  );
}
