import type { NfcCapabilities } from "./types";

const SERVER_CAPABILITIES: NfcCapabilities = {
  state: "UNSUPPORTED",
  canRead: false,
  canWrite: false,
  label: "Checking NFC support",
  detail: "NFC support is detected when the page is running in a browser.",
};

const SUPPORTED_CAPABILITIES: NfcCapabilities = {
  state: "SUPPORTED",
  canRead: true,
  canWrite: true,
  label: "Web NFC available",
  detail: "Android Chrome can read and write physical NFC stickers here.",
};

const UNSUPPORTED_CAPABILITIES: NfcCapabilities = {
  state: "UNSUPPORTED",
  canRead: false,
  canWrite: false,
  label: "Web NFC unavailable",
  detail:
    "This browser cannot write stickers directly. Manual setup remains available.",
};

export function getServerNfcCapabilities(): NfcCapabilities {
  return SERVER_CAPABILITIES;
}

export function getNfcCapabilities(): NfcCapabilities {
  if (typeof window === "undefined") {
    return SERVER_CAPABILITIES;
  }

  const supported = "NDEFReader" in window;

  if (supported) {
    return SUPPORTED_CAPABILITIES;
  }

  return UNSUPPORTED_CAPABILITIES;
}

export function getCapabilityMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("permission") || message.includes("denied")) {
    return "NFC permission was denied. Allow NFC access in your browser and try again.";
  }

  if (message.includes("disabled") || message.includes("powered")) {
    return "NFC is disabled on this device. Turn it on, then try again.";
  }

  return "This browser cannot access Web NFC. Use manual setup, or Android Chrome over HTTPS.";
}
