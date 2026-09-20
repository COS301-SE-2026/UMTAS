import type { paths } from "@/lib/api";
import { RequestBuilder, RequestMethod } from "../../../utilities/request";
import type {
  AttendanceSlot,
  CurrentSlotPreview,
  LiveAttendanceCount,
  PreparedNfcRegistration,
  RegisteredNfcTag,
  NfcTagTestResult,
} from "./types";

type GetTagOperation = paths["/api/attendance/nfc-tags/me"]["get"];
type RegisteredTagResponse =
  GetTagOperation["responses"]["200"]["content"]["application/json"];
type PrepareOperation = paths["/api/attendance/nfc-tags/registration"]["post"];
type PrepareBody =
  PrepareOperation["requestBody"]["content"]["application/json"];
type PreparedRegistrationResponse =
  PrepareOperation["responses"]["201"]["content"]["application/json"];
type ConfirmOperation =
  paths["/api/attendance/nfc-tags/registration/confirm"]["post"];
type ConfirmBody =
  ConfirmOperation["requestBody"]["content"]["application/json"];
type ConfirmResponse =
  ConfirmOperation["responses"]["201"]["content"]["application/json"];
type TestTagOperation = paths["/api/attendance/nfc-tags/test"]["post"];
type TestTagBody =
  TestTagOperation["requestBody"]["content"]["application/json"];
type TestTagResponse =
  TestTagOperation["responses"]["201"]["content"]["application/json"];
type OperatorSlotsOperation = paths["/api/attendance/operator/slots"]["get"];
type OperatorSlotsResponse =
  OperatorSlotsOperation["responses"]["200"]["content"]["application/json"];
type OperatorSlotDto = OperatorSlotsResponse["slotList"][number];
type CheckInOperation = paths["/api/attendance/records"]["post"];
type CheckInBody =
  CheckInOperation["requestBody"]["content"]["application/json"];
export type NfcCheckInResponse =
  CheckInOperation["responses"]["201"]["content"]["application/json"];
type AttendanceSessionOperation =
  paths["/api/attendance/sessions/{sessionId}"]["get"];
type AttendanceSessionPath = AttendanceSessionOperation["parameters"]["path"];
type AttendanceSessionResponse =
  AttendanceSessionOperation["responses"]["200"]["content"]["application/json"];

const EMPTY_BODY: Record<string, never> = {};
export const NFC_STATE_CHANGE_EVENT = "umtas-nfc-state-change";

class GetRegisteredTagBuilder extends RequestBuilder<
  undefined,
  undefined,
  RegisteredTagResponse
> {
  constructor() {
    super();
    this.setUrl("/attendance/nfc-tags/me").setMethod(RequestMethod.GET);
  }
}

class PrepareRegistrationBuilder extends RequestBuilder<
  undefined,
  PrepareBody,
  PreparedRegistrationResponse
> {
  constructor() {
    super();
    this.setUrl("/attendance/nfc-tags/registration").setMethod(
      RequestMethod.POST,
    );
  }
}

class ConfirmRegistrationBuilder extends RequestBuilder<
  undefined,
  ConfirmBody,
  ConfirmResponse
> {
  constructor() {
    super();
    this.setUrl("/attendance/nfc-tags/registration/confirm").setMethod(
      RequestMethod.POST,
    );
  }
}

class TestTagBuilder extends RequestBuilder<
  undefined,
  TestTagBody,
  TestTagResponse
> {
  constructor() {
    super();
    this.setUrl("/attendance/nfc-tags/test").setMethod(RequestMethod.POST);
  }
}

class GetOperatorSlotsBuilder extends RequestBuilder<
  undefined,
  undefined,
  OperatorSlotsResponse
> {
  constructor() {
    super();
    this.setUrl("/attendance/operator/slots").setMethod(RequestMethod.GET);
  }
}

class NfcCheckInBuilder extends RequestBuilder<
  undefined,
  CheckInBody,
  NfcCheckInResponse
> {
  constructor() {
    super();
    this.setUrl("/attendance/records").setMethod(RequestMethod.POST);
  }
}

class GetAttendanceSessionBuilder extends RequestBuilder<
  AttendanceSessionPath,
  undefined,
  AttendanceSessionResponse
> {
  constructor() {
    super();
    this.setUrl("/attendance/sessions/{sessionId}").setMethod(
      RequestMethod.GET,
    );
  }
}

function toAttendanceSlot(slot: OperatorSlotDto): AttendanceSlot {
  return {
    id: `${slot.eventID}:${slot.scheduledStartAt}`,
    eventID: slot.eventID,
    scheduledStartAt: slot.scheduledStartAt,
    sessionId: slot.sessionId,
    moduleCode: slot.moduleCode,
    moduleName: slot.moduleName,
    venue: slot.venue ?? "Venue not set",
    startAt: slot.scheduledStartAt,
    endAt: slot.scheduledEndAt,
    state: slot.state,
    attendanceCount: slot.attendanceCount,
  };
}

export async function getRegisteredTag(): Promise<RegisteredNfcTag | null> {
  const response = await new GetRegisteredTagBuilder().send({});
  return response.tag;
}

export async function prepareTagRegistration(): Promise<PreparedNfcRegistration> {
  return new PrepareRegistrationBuilder().send({ body: EMPTY_BODY });
}

export async function confirmTagRegistration(
  registration: PreparedNfcRegistration,
): Promise<RegisteredNfcTag> {
  const tag = await new ConfirmRegistrationBuilder().send({
    body: { activationTicket: registration.activationTicket },
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NFC_STATE_CHANGE_EVENT));
  }
  return tag;
}

export async function testNfcTag(input: {
  tagId: string;
  token: string;
}): Promise<NfcTagTestResult> {
  return new TestTagBuilder().send({ body: input });
}

export async function getOperatorAttendanceOverview(): Promise<{
  slots: AttendanceSlot[];
  preview: CurrentSlotPreview;
}> {
  const result = await new GetOperatorSlotsBuilder().send({});
  const slots = result.slotList.map(toAttendanceSlot);
  return {
    slots,
    preview: {
      slot: result.currentSlot ? toAttendanceSlot(result.currentSlot) : null,
      ambiguous: result.ambiguous,
    },
  };
}

export async function getTodayAttendanceSlots(): Promise<AttendanceSlot[]> {
  return (await getOperatorAttendanceOverview()).slots;
}

export async function getCurrentSlotPreview(): Promise<CurrentSlotPreview> {
  return (await getOperatorAttendanceOverview()).preview;
}

export async function getLiveAttendanceCount(
  sessionId: string,
): Promise<LiveAttendanceCount> {
  const session = await new GetAttendanceSessionBuilder().send({
    paths: { sessionId },
  });
  return {
    slotId: session.SessionID,
    identifiedCount: session.identifiedCount,
    guestCount: session.guestCount,
    total: session.attendedCount,
    updatedAt: session.updatedAt,
  };
}

export async function submitNfcCheckIn(
  input: Omit<CheckInBody, "captureMethod">,
): Promise<NfcCheckInResponse> {
  return new NfcCheckInBuilder().send({
    body: { ...input, captureMethod: "NFC" },
  });
}
