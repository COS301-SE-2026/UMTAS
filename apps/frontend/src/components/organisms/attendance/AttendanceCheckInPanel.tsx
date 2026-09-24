"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { UserRoundCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { AttendanceStatusPill } from "@/components/atoms/attendance/AttendanceStatusPill";
import { AttendancePageHeader } from "@/components/molecules/attendance/AttendancePageHeader";
import { CheckInResultCard } from "@/components/molecules/attendance/CheckInResultCard";
import { ScanInstructions } from "@/components/molecules/attendance/ScanInstructions";
import {
  getNfcCapabilities,
  getServerNfcCapabilities,
} from "@/lib/nfc_attendance/capabilities";
import { checkInFromTagUrl } from "@/lib/nfc_attendance/check_in";
import { buildNfcTagUrl } from "@/lib/nfc_attendance/tag_url";
import { scanNdefUrl } from "@/lib/nfc_attendance/web_nfc";
import type { CheckInResult, CheckInState } from "@/lib/nfc_attendance/types";

const terminalStates: CheckInState[] = [
  "RECORDED",
  "ALREADY_RECORDED",
  "NO_CURRENT_EVENT",
  "AMBIGUOUS_EVENT",
  "NOT_ENROLLED",
  "INVALID_TAG",
  "FAILED",
];

export function AttendanceCheckInPanel() {
  const searchParams = useSearchParams();
  const capabilities = useSyncExternalStore(
    () => () => {},
    getNfcCapabilities,
    getServerNfcCapabilities,
  );
  const [state, setState] = useState<CheckInState>("READY_TO_SCAN");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const submittedUrlRef = useRef<string | null>(null);
  const lastTagUrlRef = useRef<string | null>(null);

  async function submitTagUrl(url: string) {
    setState("SUBMITTING");
    setResult(null);
    try {
      const nextResult = await checkInFromTagUrl(url);
      setResult(nextResult);
      setState(nextResult.code);
    } catch (error) {
      if (error instanceof Error && /HTTP 403\b/.test(error.message)) {
        toast.error(
          "You are trying to attend a module you are not enrolled in.",
        );
        setState("NOT_ENROLLED");
        setResult({
          code: "NOT_ENROLLED",
          message: "You are not enrolled in this module.",
        });
        return;
      }
      setState("FAILED");
      setResult({
        code: "FAILED",
        message: "We could not complete check-in. Please try again.",
      });
    }
  }

  useEffect(() => {
    const tagId = searchParams.get("tagId");
    const token = searchParams.get("token");
    if (!tagId || !token) return;
    const url = buildNfcTagUrl(tagId, token, window.location.origin);
    if (submittedUrlRef.current === url) return;
    submittedUrlRef.current = url;
    lastTagUrlRef.current = url;
    void submitTagUrl(url);
  }, [searchParams]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function handleScan() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState("SCANNING");
    setResult(null);
    try {
      const url = await scanNdefUrl({ signal: controller.signal });
      lastTagUrlRef.current = url;
      await submitTagUrl(url);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setState("FAILED");
      setResult({
        code: "FAILED",
        message:
          error instanceof Error
            ? error.message
            : "The NFC sticker could not be read.",
      });
    }
  }

  function handleRetry() {
    abortRef.current?.abort();
    if (lastTagUrlRef.current) {
      submittedUrlRef.current = lastTagUrlRef.current;
      void submitTagUrl(lastTagUrlRef.current);
      return;
    }
    setResult(null);
    setState("READY_TO_SCAN");
  }

  const hasTerminalResult = terminalStates.includes(state);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-6 py-6">
      <AttendancePageHeader
        title="Attendance check-in"
        description="Scan your lecturer's NFC sticker to record your attendance."
        action={
          <span className="flex items-center gap-1.5">
            <UserRoundCheck size={13} aria-hidden="true" /> Sign-in optional
          </span>
        }
      />

      {hasTerminalResult && result ? (
        <CheckInResultCard
          state={state}
          result={result}
          onRetry={handleRetry}
        />
      ) : state === "SUBMITTING" ? (
        <Card className="border-[var(--border)] bg-[var(--bg-surface)]">
          <CardContent className="flex items-center gap-3">
            <div
              className="size-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--text-primary)]"
              aria-hidden="true"
            />
            <div>
              <AttendanceStatusPill status="SUBMITTING" />
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Checking your class and enrollment…
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScanInstructions
          capabilities={capabilities}
          onScan={() => void handleScan()}
          scanning={state === "SCANNING"}
        />
      )}
    </div>
  );
}
