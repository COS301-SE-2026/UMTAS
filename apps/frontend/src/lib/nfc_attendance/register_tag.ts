import { writeNdefUrl } from "./web_nfc";
import {
  confirmTagRegistration,
  prepareTagRegistration,
  testNfcTag,
} from "./nfc_api";
import { parseNfcTagUrl } from "./tag_url";
import type {
  NfcTagTestResult,
  PreparedNfcRegistration,
  RegisteredNfcTag,
} from "./types";

export async function prepareRegistration(): Promise<PreparedNfcRegistration> {
  return prepareTagRegistration();
}

export async function writePreparedTag(
  registration: PreparedNfcRegistration,
): Promise<void> {
  await writeNdefUrl(registration.tagUrl);
}

export async function confirmRegistration(
  registration: PreparedNfcRegistration,
): Promise<RegisteredNfcTag> {
  return confirmTagRegistration(registration);
}

export async function testRegisteredTagUrl(
  url: string,
): Promise<NfcTagTestResult> {
  const parsed = parseNfcTagUrl(url);
  if (!parsed) {
    return {
      valid: false,
      message: "This sticker does not contain a valid UMTAS attendance link.",
    };
  }
  return testNfcTag(parsed);
}
