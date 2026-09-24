"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/baseShadcn/dialog";
import { SlotSummaryCard } from "@/components/molecules/attendance/SlotSummaryCard";
import type { AttendanceSlot } from "@/lib/nfc_attendance/types";

export function ConflictingEventDialog({
  open,
  onOpenChange,
  slots,
  selectedSlotId,
  busy,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slots: AttendanceSlot[];
  selectedSlotId: string | null;
  busy: boolean;
  onSelect: (slot: AttendanceSlot) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose the current class</DialogTitle>
          <DialogDescription>
            More than one attendance slot is available. Your choice applies to
            NFC taps and barcode capture, and remains preferred for future
            occurrences until you change it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          {slots.map((slot) => (
            <SlotSummaryCard
              key={slot.id}
              slot={slot}
              selected={slot.id === selectedSlotId}
              busy={busy}
              onSelect={() => onSelect(slot)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
