"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Clipboard, ShieldAlert } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Textarea } from "@/components/atoms/baseShadcn/textarea";
import type { PreparedNfcRegistration } from "@/lib/nfc_attendance/types";

function formatRemaining(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function PreparedTagUrl({
  registration,
  expired,
  onExpire,
}: {
  registration: PreparedNfcRegistration;
  expired: boolean;
  onExpire: () => void;
}) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const expirationReported = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const [copyFallback, setCopyFallback] = useState(false);
  const expiresAt = new Date(registration.expiresAt).getTime();
  const remaining = Math.max(0, expiresAt - now);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 1_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (remaining > 0 || expirationReported.current) return;
    expirationReported.current = true;
    onExpire();
  }, [onExpire, remaining]);

  async function copyUrl() {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(registration.tagUrl);
      setCopied(true);
      setCopyFallback(false);
    } catch {
      fieldRef.current?.focus();
      fieldRef.current?.select();
      setCopied(false);
      setCopyFallback(true);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label
          htmlFor="prepared-nfc-url"
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          Registration URL
        </label>
        <Textarea
          ref={fieldRef}
          id="prepared-nfc-url"
          value={registration.tagUrl}
          readOnly
          spellCheck={false}
          rows={4}
          data-ph-no-capture
          className="min-h-24 resize-none break-all font-mono text-xs"
          aria-describedby="prepared-nfc-url-security"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => void copyUrl()} disabled={expired}>
          {copied ? (
            <Check aria-hidden="true" />
          ) : (
            <Clipboard aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy URL"}
        </Button>
        <p className="text-xs text-[var(--text-secondary)]" aria-live="polite">
          {expired
            ? "This URL has expired."
            : `Expires at ${new Date(registration.expiresAt).toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )} (${formatRemaining(remaining)} remaining)`}
        </p>
      </div>

      <div
        className="min-h-5 text-xs text-[var(--text-secondary)]"
        aria-live="polite"
      >
        {copied && "Registration URL copied."}
        {copyFallback &&
          "Automatic copy was blocked. The full URL is selected; use your device's Copy action."}
      </div>

      <p
        id="prepared-nfc-url-security"
        className="flex gap-2 text-xs text-[var(--text-secondary)]"
      >
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Anyone with this link can use the sticker credential. Only write it to
        the intended NFC sticker and do not share it.
      </p>
    </div>
  );
}
