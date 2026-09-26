import { RefreshCw } from "lucide-react";
import { Accordion } from "@/components/atoms/baseShadcn/accordion";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { AttendanceModuleRow } from "@/components/molecules/attendance/AttendanceModuleRow";
import type { AttendanceModuleGroup } from "@/lib/nfc_attendance/attendance_overview";
import type { AttendanceSlot } from "@/lib/nfc_attendance/types";

export function AttendanceModuleList({
  groups,
  preferredEventId,
  loading,
  refreshing,
  selecting,
  canAdjustPreference,
  onRefresh,
  onChoose,
}: {
  groups: AttendanceModuleGroup[];
  preferredEventId: string | null;
  loading: boolean;
  refreshing: boolean;
  selecting: boolean;
  canAdjustPreference: boolean;
  onRefresh: () => void;
  onChoose: (slot: AttendanceSlot) => void;
}) {
  const availableSlotCount = groups.reduce(
    (count, group) =>
      count + group.slots.filter((slot) => slot.state === "AVAILABLE").length,
    0,
  );
  const hasConflict = availableSlotCount > 1;

  return (
    <section className="mt-6" aria-labelledby="today-slots-heading">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2
            id="today-slots-heading"
            className="text-[15px] font-medium text-[var(--text-primary)]"
          >
            Today&apos;s classes
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={14}
            className={refreshing ? "animate-spin" : ""}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div
          className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-base)]"
          aria-label="Loading today's classes"
        >
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex min-h-20 items-center gap-5 border-b border-[var(--border)] px-4 last:border-b-0"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-44 max-w-full" />
              </div>
              <Skeleton className="hidden h-9 flex-[1.2] sm:block" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-base)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
          No classes are scheduled for today.
        </div>
      ) : (
        <Accordion
          type="multiple"
          className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-base)]"
        >
          {groups.map((group) => (
            <AttendanceModuleRow
              key={group.key}
              group={group}
              preferredEventId={preferredEventId}
              hasConflict={hasConflict}
              canAdjustPreference={canAdjustPreference}
              selecting={selecting}
              onChoose={onChoose}
            />
          ))}
        </Accordion>
      )}
    </section>
  );
}
