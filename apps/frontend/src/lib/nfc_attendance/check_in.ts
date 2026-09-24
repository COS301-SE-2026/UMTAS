import { parseNfcTagUrl } from "./tag_url";
import { submitNfcCheckIn } from "./nfc_api";
import type { CheckInResult } from "./types";

export async function checkInFromTagUrl(url: string): Promise<CheckInResult> {
  const parsed = parseNfcTagUrl(url);

  if (!parsed) {
    return {
      code: "INVALID_TAG",
      message: "This does not look like a valid UMTAS attendance sticker.",
    };
  }

  const response = await submitNfcCheckIn(parsed);
  return {
    code: response.status,
    message: response.message,
    recordedAt: response.recordedAt ?? undefined,
  };
}
