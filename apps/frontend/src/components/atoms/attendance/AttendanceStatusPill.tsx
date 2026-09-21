import { Badge } from "@/components/atoms/baseShadcn/badge";
import type {
  AttendanceSlotState,
  CheckInState,
  NfcCapabilityState,
  RegistrationStage,
} from "@/lib/nfc_attendance/types";

type Status =
  | AttendanceSlotState
  | CheckInState
  | NfcCapabilityState
  | RegistrationStage
  | "NOT_REGISTERED";

const labels: Record<string, string> = {
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
  CONFIRMING: "Confirming",
  PREPARE_FAILED: "Prepare failed",
  WRITE_FAILED: "Write failed",
  CONFIRM_FAILED: "Confirm failed",
  EXPIRED: "Expired",
  UPCOMING: "Upcoming",
  AVAILABLE: "Available",
  ENDING: "Ending soon",
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
};

export function AttendanceStatusPill({
  status,
  className = "",
}: {
  status: Status;
  className?: string;
}) {
  const positive = ["READY", "RECORDED", "AVAILABLE", "SUPPORTED"].includes(
    status,
  );
  const negative = [
    "WRITE_FAILED",
    "PREPARE_FAILED",
    "CONFIRM_FAILED",
    "EXPIRED",
    "FAILED",
    "INVALID_TAG",
    "NOT_ENROLLED",
    "UNSUPPORTED",
    "PERMISSION_DENIED",
    "DISABLED",
  ].includes(status);

  return (
    <Badge
      variant="outline"
      className={`font-normal ${
        positive
          ? "border-[var(--success-text)]/30 text-[var(--success-text)]"
          : negative
            ? "border-[var(--error-text)]/30 text-[var(--error-text)]"
            : "border-[var(--border)] text-[var(--text-secondary)]"
      } ${className}`}
    >
      {labels[status] ?? status}
    </Badge>
  );
}
