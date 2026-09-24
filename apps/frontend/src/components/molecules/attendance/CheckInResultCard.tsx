import { RotateCcw } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { AttendanceStatusPill } from "@/components/atoms/attendance/AttendanceStatusPill";
import { formatSlotTime } from "./SlotSummaryCard";
import type { CheckInResult, CheckInState } from "@/lib/nfc_attendance/types";

export function CheckInResultCard({
  state,
  result,
  onRetry,
}: {
  state: CheckInState;
  result: CheckInResult | null;
  onRetry: () => void;
}) {
  const success = state === "RECORDED" || state === "ALREADY_RECORDED";
  return (
    <Card className="border-[var(--border)] bg-[var(--bg-surface)]">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {state === "RECORDED"
              ? "Attendance recorded"
              : state === "ALREADY_RECORDED"
                ? "Already checked in"
                : "Check-in unsuccessful"}
          </h2>
          <AttendanceStatusPill status={state} />
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          {result?.message}
        </p>
        {result?.slot && (
          <p className="text-sm text-[var(--text-primary)]">
            {result.slot.moduleCode} · {result.slot.moduleName}
            <br />
            <span className="text-xs text-[var(--text-secondary)]">
              {formatSlotTime(result.slot.startAt, result.slot.endAt)} ·{" "}
              {result.slot.venue}
            </span>
          </p>
        )}
        {!success && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw size={15} aria-hidden="true" /> Try another tap
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
