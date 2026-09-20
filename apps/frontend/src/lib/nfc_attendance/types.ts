export type NfcCapabilityState =
  "SUPPORTED" | "UNSUPPORTED" | "PERMISSION_DENIED" | "DISABLED";

export type NfcTagState = "NOT_REGISTERED" | "READY";

export type NfcTagTestState =
  "IDLE" | "SCANNING" | "VALID" | "INVALID" | "FAILED";

export type RegistrationMethod = "WEB_NFC" | "MANUAL";

export type RegistrationStage =
  | "CHOOSE_METHOD"
  | "PREPARING"
  | "PREPARED"
  | "WRITING_WEB_NFC"
  | "WRITTEN"
  | "CONFIRMING"
  | "READY"
  | "PREPARE_FAILED"
  | "WRITE_FAILED"
  | "CONFIRM_FAILED"
  | "EXPIRED";

export type AttendanceSlotState = "UPCOMING" | "AVAILABLE" | "ENDED";

export type CheckInState =
  | "READY_TO_SCAN"
  | "SCANNING"
  | "SUBMITTING"
  | "RECORDED"
  | "ALREADY_RECORDED"
  | "NO_CURRENT_EVENT"
  | "AMBIGUOUS_EVENT"
  | "NOT_ENROLLED"
  | "INVALID_TAG"
  | "FAILED";

export interface NfcCapabilities {
  state: NfcCapabilityState;
  canRead: boolean;
  canWrite: boolean;
  label: string;
  detail: string;
}

export interface RegisteredNfcTag {
  tagId: string;
  displayId: string;
  registeredAt: string;
}

export interface NfcTagTestResult {
  valid: boolean;
  message: string;
  displayId?: string | null;
}

export interface PreparedNfcRegistration {
  tagId: string;
  token: string;
  tagUrl: string;
  activationTicket: string;
  expiresAt: string;
}

export interface AttendanceSlot {
  id: string;
  eventID: string;
  scheduledStartAt: string;
  sessionId: string | null;
  moduleCode: string;
  moduleName: string;
  venue: string;
  startAt: string;
  endAt: string;
  state: AttendanceSlotState;
  attendanceCount: number;
}

export interface CurrentSlotPreview {
  slot: AttendanceSlot | null;
  ambiguous: boolean;
  message?: string;
}

export interface LiveAttendanceCount {
  slotId: string;
  identifiedCount: number;
  guestCount: number;
  total: number;
  updatedAt: string;
}

export type CheckInResultCode = Exclude<
  CheckInState,
  "READY_TO_SCAN" | "SCANNING" | "SUBMITTING"
>;

export interface CheckInResult {
  code: CheckInResultCode;
  message: string;
  slot?: AttendanceSlot;
  recordedAt?: string;
}

export interface NfcScanOptions {
  signal?: AbortSignal;
  onReading?: (url: string) => void;
}
