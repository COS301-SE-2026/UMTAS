import { AttendanceStatusPill } from "@/components/atoms/attendance/AttendanceStatusPill";
import { Button } from "@/components/atoms/baseShadcn/button";
import type { AttendanceSlot } from "@/lib/nfc_attendance/types";

export function formatSlotTime(startAt: string, endAt: string) {
  const formatter = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formatter.format(new Date(startAt))} – ${formatter.format(new Date(endAt))}`;
}

export function SlotSummaryCard({
  slot,
  selected = false,
  onSelect,
  busy = false,
  variant = "list",
}: {
  slot: AttendanceSlot;
  selected?: boolean;
  onSelect?: () => void;
  busy?: boolean;
  variant?: "list" | "current";
}) {
  if (variant === "current") {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3"
        aria-label="Current class"
      >
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-[var(--text-primary)]">
            {slot.moduleCode} · {slot.moduleName}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            {formatSlotTime(slot.startAt, slot.endAt)} · {slot.venue}
          </p>
        </div>
        <AttendanceStatusPill status="IN_PROGRESS" />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-3 border-b py-3 sm:flex-row sm:items-center sm:justify-between ${
        selected ? "border-[var(--text-primary)]" : "border-[var(--border)]"
      }`}
    >
      <div className="flex min-w-0 items-start justify-between gap-4 sm:block">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {slot.moduleCode} · {slot.moduleName}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {formatSlotTime(slot.startAt, slot.endAt)} · {slot.venue}
          </p>
        </div>
        <AttendanceStatusPill status={slot.state} className="sm:hidden" />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <AttendanceStatusPill
          status={slot.state}
          className="hidden sm:inline-flex"
        />
        {onSelect && !selected && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSelect}
            disabled={busy}
          >
            {busy
              ? "Selecting…"
              : slot.state === "AVAILABLE"
                ? "Use for attendance"
                : "Set as preferred"}
          </Button>
        )}
      </div>
    </div>
  );
}
