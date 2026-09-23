import { Badge } from "@/components/atoms/baseShadcn/badge";
import type {
  AttendanceSlotState,
  CheckInState,
  NfcCapabilityState,
  RegistrationStage,
} from "@/lib/nfc_attendance/types";

export type AttendanceStatus =
  | AttendanceSlotState
  | CheckInState
  | NfcCapabilityState
  | RegistrationStage
  | "NOT_REGISTERED"
  | "IN_PROGRESS"
  | "CONFLICT"
  | "PREFERRED"
  | "COMPLETE";

type StatusTone = "positive" | "negative" | "warning" | "neutral";

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  SUPPORTED: "Available",
  UNSUPPORTED: "Unavailable",
  PERMISSION_DENIED: "Permission denied",
  DISABLED: "NFC disabled",
  NOT_REGISTERED: "Not registered",
  READY: "Ready",
  CHOOSE_METHOD: "Choose method",
  PREPARING: "Preparing",
  PREPARED: "Prepared",
  WRITING_WEB_NFC: "Writing",
  WRITTEN: "Written",
  CONFIRMING: "Confirming",
  PREPARE_FAILED: "Prepare failed",
  WRITE_FAILED: "Write failed",
  CONFIRM_FAILED: "Confirm failed",
  EXPIRED: "Expired",
  UPCOMING: "Upcoming",
  AVAILABLE: "Available",
  ENDED: "Ended",
  READY_TO_SCAN: "Ready to scan",
  SCANNING: "Scanning",
  SUBMITTING: "Checking in",
  RECORDED: "Recorded",
  ALREADY_RECORDED: "Already recorded",
  NO_CURRENT_EVENT: "No current event",
  AMBIGUOUS_EVENT: "Choose an event",
  NOT_ENROLLED: "Not enrolled",
  INVALID_TAG: "Invalid sticker",
  FAILED: "Try again",
  IN_PROGRESS: "In progress",
  CONFLICT: "Conflict",
  PREFERRED: "Preferred",
  COMPLETE: "Complete",
};

const attendanceStatusTones: Partial<
  Record<AttendanceStatus, Exclude<StatusTone, "neutral">>
> = {
  READY: "positive",
  RECORDED: "positive",
  AVAILABLE: "positive",
  SUPPORTED: "positive",
  IN_PROGRESS: "positive",
  COMPLETE: "positive",
  CONFLICT: "warning",
  WRITE_FAILED: "negative",
  PREPARE_FAILED: "negative",
  CONFIRM_FAILED: "negative",
  EXPIRED: "negative",
  FAILED: "negative",
  INVALID_TAG: "negative",
  NOT_ENROLLED: "negative",
  UNSUPPORTED: "negative",
  PERMISSION_DENIED: "negative",
  DISABLED: "negative",
};

const toneClasses: Record<StatusTone, string> = {
  positive: "border-[var(--success-text)]/30 text-[var(--success-text)]",
  negative: "border-[var(--error-text)]/30 text-[var(--error-text)]",
  warning: "border-[var(--warning-text)]/30 text-[var(--warning-text)]",
  neutral: "border-[var(--border)] text-[var(--text-secondary)]",
};

export function AttendanceStatusPill({
  status,
  label,
  className = "",
}: {
  status: AttendanceStatus;
  label?: string;
  className?: string;
}) {
  const tone = attendanceStatusTones[status] ?? "neutral";

  return (
    <Badge
      variant="outline"
      className={`h-5 font-normal ${toneClasses[tone]} ${className}`}
    >
      {label ?? attendanceStatusLabels[status]}
    </Badge>
  );
}
