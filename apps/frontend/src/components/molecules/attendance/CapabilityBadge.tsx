import { AttendanceStatusPill } from "@/components/atoms/attendance/AttendanceStatusPill";
import type { NfcCapabilities } from "@/lib/nfc_attendance/types";

export function CapabilityBadge({
  capabilities,
}: {
  capabilities: NfcCapabilities;
}) {
  return (
    <div className="flex items-center gap-2">
      <span>{capabilities.label}</span>
      <AttendanceStatusPill status={capabilities.state} />
    </div>
  );
}
