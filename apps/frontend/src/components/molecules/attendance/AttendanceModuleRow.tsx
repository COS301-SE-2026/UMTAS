import { AttendanceStatusPill } from "@/components/atoms/attendance/AttendanceStatusPill";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/atoms/baseShadcn/accordion";
import { AttendanceSlotDetailRow } from "@/components/molecules/attendance/AttendanceSlotDetailRow";
import { formatSlotTime } from "@/components/molecules/attendance/SlotSummaryCard";
import type { AttendanceModuleGroup } from "@/lib/nfc_attendance/attendance_overview";
import type { AttendanceSlot } from "@/lib/nfc_attendance/types";

export function AttendanceModuleRow({
  group,
  preferredEventId,
  hasConflict,
  canAdjustPreference,
  selecting,
  onChoose,
}: {
  group: AttendanceModuleGroup;
  preferredEventId: string | null;
  hasConflict: boolean;
  canAdjustPreference: boolean;
  selecting: boolean;
  onChoose: (slot: AttendanceSlot) => void;
}) {
  const representative = group.representativeSlot;
  const preferred = representative.eventID === preferredEventId;
  const kicker =
    representative.state === "AVAILABLE"
      ? "Current class"
      : representative.state === "UPCOMING"
        ? "Next class"
        : "Latest class";
  const metadata =
    representative.state === "AVAILABLE"
      ? `${representative.attendanceCount} attendees recorded`
      : representative.state === "UPCOMING"
        ? "Starts later today"
        : `${representative.attendanceCount} attendees recorded`;
  const summaryStatus =
    representative.state === "AVAILABLE"
      ? hasConflict && !preferred
        ? preferredEventId
          ? "AVAILABLE"
          : "CONFLICT"
        : "IN_PROGRESS"
      : representative.state === "ENDED"
        ? "COMPLETE"
        : "UPCOMING";

  return (
    <AccordionItem value={group.key} className="border-[var(--border)]">
      <AccordionTrigger className="min-h-20 rounded-none px-4 py-3 hover:bg-[var(--bg-surface)]/70 hover:no-underline data-[state=open]:bg-[var(--bg-surface)]/70">
        <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 pr-3 md:grid-cols-[minmax(12rem,1.1fr)_minmax(17rem,1.4fr)_auto] md:gap-x-5">
          <span className="min-w-0">
            <span className="block text-[15px] font-medium text-[var(--text-primary)]">
              {group.moduleCode}
            </span>
            <span className="mt-0.5 block truncate text-xs font-normal text-[var(--text-secondary)]">
              {group.moduleName}
            </span>
          </span>
          <span className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
            <span className="block text-[11px] font-medium tracking-[0.04em] text-[var(--text-secondary)] uppercase">
              {kicker}
            </span>
            <span className="mt-0.5 block font-medium text-[var(--text-primary)]">
              {formatSlotTime(representative.startAt, representative.endAt)} ·{" "}
              {representative.venue}
            </span>
            <span className="mt-0.5 block text-xs font-normal text-[var(--text-secondary)]">
              {metadata}
            </span>
          </span>
          <AttendanceStatusPill
            status={summaryStatus}
            className="col-start-2 row-start-1 justify-self-end md:col-start-3"
          />
        </span>
      </AccordionTrigger>
      <AccordionContent className="bg-[var(--bg-surface)]/70 px-4 pb-3">
        {group.slots.map((slot) => {
          const slotPreferred = slot.eventID === preferredEventId;
          return (
            <AttendanceSlotDetailRow
              key={slot.id}
              slot={slot}
              preferred={slotPreferred}
              busy={selecting}
              onChoose={
                canAdjustPreference &&
                slot.state === "AVAILABLE" &&
                !slotPreferred
                  ? onChoose
                  : undefined
              }
            />
          );
        })}
      </AccordionContent>
    </AccordionItem>
  );
}
