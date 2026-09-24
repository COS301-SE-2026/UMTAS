import { RotateCcw } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
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

  const title =
    state === "RECORDED"
      ? "Attendance recorded"
      : state === "ALREADY_RECORDED"
        ? "Attendance already recorded"
        : "Attendance was not recorded";

  return (
    <Card className="border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
      <CardHeader className="border-b border-[var(--border)]">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">{title}</CardTitle>

          <AttendanceStatusPill status={state} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        {result?.message && (
          <p className="text-sm text-[var(--text-secondary)]">
            {result.message}
          </p>
        )}

        {result?.slot && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {result.slot.moduleCode} · {result.slot.moduleName}
            </p>

            <div className="mt-2 grid gap-1 text-xs text-[var(--text-secondary)]">
              <p>{formatSlotTime(result.slot.startAt, result.slot.endAt)}</p>
              <p>{result.slot.venue}</p>
            </div>
          </div>
        )}

        {!success && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw size={16} aria-hidden="true" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
