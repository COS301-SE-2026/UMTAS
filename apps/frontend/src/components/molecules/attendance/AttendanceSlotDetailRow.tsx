import { AttendanceStatusPill } from "@/components/atoms/attendance/AttendanceStatusPill";
import { Button } from "@/components/atoms/baseShadcn/button";
import { formatSlotTime } from "@/components/molecules/attendance/SlotSummaryCard";
import type { AttendanceSlot } from "@/lib/nfc_attendance/types";

export function AttendanceSlotDetailRow({
  slot,
  preferred,
  busy,
  onChoose,
}: {
  slot: AttendanceSlot;
  preferred: boolean;
  busy: boolean;
  onChoose?: (slot: AttendanceSlot) => void;
}) {
  const metadata =
    slot.state === "AVAILABLE"
      ? `${slot.attendanceCount} recorded`
      : slot.state === "UPCOMING"
        ? "Today · upcoming"
        : `Ended · ${slot.attendanceCount} recorded`;

  return (
    <div className="grid min-h-14 grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-t border-[var(--border)] py-2 pr-7 sm:grid-cols-[7rem_minmax(0,1fr)_auto]">
      <span className="text-xs tabular-nums text-[var(--text-secondary)]">
        {formatSlotTime(slot.startAt, slot.endAt)}
      </span>
      <div className="min-w-0">
        <p className="font-medium text-[var(--text-primary)]">
          Class · {slot.venue}
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
          {metadata}
        </p>
      </div>
      <div className="col-start-2 justify-self-end sm:col-start-3 sm:row-start-1">
        {preferred ? (
          <AttendanceStatusPill status="PREFERRED" />
        ) : onChoose ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => onChoose(slot)}
          >
            {busy ? "Saving…" : "Choose class"}
          </Button>
        ) : (
          <AttendanceStatusPill
            status={slot.state === "ENDED" ? "COMPLETE" : slot.state}
          />
        )}
      </div>
    </div>
  );
}
