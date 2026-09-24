import { AttendanceStatusPill } from "@/components/atoms/attendance/AttendanceStatusPill";
import { Button } from "@/components/atoms/baseShadcn/button";
import type { AttendanceSlot } from "@/lib/nfc_attendance/types";

export function formatSlotTime(startAt: string, endAt: string) {
  const formatter = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(startAt))} – ${formatter.format(
    new Date(endAt),
  )}`;
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
        className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-4"
        aria-label="Current class"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)]">
              Current class
            </p>

            <p className="mt-1 text-[15px] font-medium text-[var(--text-primary)]">
              {slot.moduleCode} · {slot.moduleName}
            </p>

            <div className="mt-2 grid gap-1 text-xs text-[var(--text-secondary)]">
              <p>{formatSlotTime(slot.startAt, slot.endAt)}</p>
              <p>{slot.venue}</p>
            </div>
          </div>

          <AttendanceStatusPill status="IN_PROGRESS" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-4 ${
        selected
          ? "border-[var(--text-primary)] bg-[var(--bg-elevated)]"
          : "border-[var(--border)] bg-[var(--bg-base)]"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {slot.moduleCode} · {slot.moduleName}
          </p>

          <div className="mt-1 grid gap-0.5 text-xs text-[var(--text-secondary)]">
            <p>{formatSlotTime(slot.startAt, slot.endAt)}</p>
            <p>{slot.venue}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <AttendanceStatusPill status={slot.state} />

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
                  ? "Use this class"
                  : "Set preference"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
