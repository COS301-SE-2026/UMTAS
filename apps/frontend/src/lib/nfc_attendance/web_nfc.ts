import { getCapabilityMessage } from "./capabilities";
import type { NfcScanOptions } from "./types";

interface NdefRecordLike {
  recordType?: string;
  data?: string | ArrayBuffer | DataView;
}

interface NdefReadingEventLike extends Event {
  message?: { records?: NdefRecordLike[] };
}

interface NdefReaderLike {
  onreading: ((event: NdefReadingEventLike) => void) | null;
  onreadingerror: (() => void) | null;
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  write(message: {
    records: Array<{ recordType: string; data: string }>;
  }): Promise<void>;
}

function getReader(): NdefReaderLike {
  if (typeof window === "undefined" || !("NDEFReader" in window)) {
    throw new Error("Web NFC is unsupported");
  }

  const Reader = (window as unknown as { NDEFReader: new () => NdefReaderLike })
    .NDEFReader;
  return new Reader();
}

function decodeRecordData(data: NdefRecordLike["data"]): string {
  if (typeof data === "string") return data;
  if (!data) return "";

  const buffer =
    data instanceof DataView
      ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
      : data;

  return new TextDecoder().decode(buffer);
}

export async function writeNdefUrl(url: string): Promise<void> {
  try {
    const reader = getReader();
    await reader.write({
      records: [{ recordType: "url", data: url }],
    });
  } catch (error) {
    throw new Error(getCapabilityMessage(error));
  }
}

export async function scanNdefUrl(
  options: NfcScanOptions = {},
): Promise<string> {
  const reader = getReader();

  return new Promise<string>(async (resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      callback();
    };

    reader.onreadingerror = () =>
      finish(() => reject(new Error("The NFC sticker could not be read.")));

    reader.onreading = (event) => {
      const records = event.message?.records ?? [];
      const urlRecord = records.find(
        (record) =>
          record.recordType === "url" || record.recordType === "absolute-url",
      );
      const url = decodeRecordData(urlRecord?.data);

      if (!url) {
        finish(() =>
          reject(new Error("This sticker does not contain a UMTAS URL.")),
        );
        return;
      }

      options.onReading?.(url);
      finish(() => resolve(url));
    };

    options.signal?.addEventListener(
      "abort",
      () =>
        finish(() =>
          reject(new DOMException("NFC scan cancelled", "AbortError")),
        ),
      { once: true },
    );

    try {
      await reader.scan({ signal: options.signal });
    } catch (error) {
      finish(() => reject(new Error(getCapabilityMessage(error))));
    }
  });
}
