"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { CircleHelp, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/atoms/baseShadcn/alert";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { CapabilityBadge } from "@/components/molecules/attendance/CapabilityBadge";
import { AttendanceCountTile } from "@/components/molecules/attendance/AttendanceCountTile";
import { AttendancePageHeader } from "@/components/molecules/attendance/AttendancePageHeader";
import { NfcTagStatusCard } from "@/components/molecules/attendance/NfcTagStatusCard";
import { NfcTagTestResult } from "@/components/molecules/attendance/NfcTagTestResult";
import { NfcRegistrationTutorial } from "@/components/molecules/attendance/NfcRegistrationTutorial";
import { RegistrationStepper } from "@/components/molecules/attendance/RegistrationStepper";
import { SlotSummaryCard } from "@/components/molecules/attendance/SlotSummaryCard";
import {
  getNfcCapabilities,
  getServerNfcCapabilities,
} from "@/lib/nfc_attendance/capabilities";
import {
  confirmRegistration,
  prepareRegistration,
  testRegisteredTagUrl,
  writePreparedTag,
} from "@/lib/nfc_attendance/register_tag";
import { scanNdefUrl } from "@/lib/nfc_attendance/web_nfc";
import {
  getLiveAttendanceCount,
  getOperatorAttendanceOverview,
  getRegisteredTag,
  NFC_STATE_CHANGE_EVENT,
} from "@/lib/nfc_attendance/nfc_api";
import type {
  AttendanceSlot,
  CurrentSlotPreview,
  LiveAttendanceCount,
  NfcTagTestResult as TagTestResult,
  NfcTagTestState,
  PreparedNfcRegistration,
  RegisteredNfcTag,
  RegistrationMethod,
  RegistrationStage,
} from "@/lib/nfc_attendance/types";

export function AttendanceManagePanel() {
  const capabilities = useSyncExternalStore(
    () => () => {},
    getNfcCapabilities,
    getServerNfcCapabilities,
  );
  const [tag, setTag] = useState<RegisteredNfcTag | null>(null);
  const [slots, setSlots] = useState<AttendanceSlot[]>([]);
  const [preview, setPreview] = useState<CurrentSlotPreview | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [count, setCount] = useState<LiveAttendanceCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [countLoading, setCountLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<RegistrationStage>("CHOOSE_METHOD");
  const [method, setMethod] = useState<RegistrationMethod | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [manuallyVerified, setManuallyVerified] = useState(false);
  const [prepared, setPrepared] = useState<PreparedNfcRegistration | null>(
    null,
  );
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );
  const [tagTestState, setTagTestState] = useState<NfcTagTestState>("IDLE");
  const [tagTestResult, setTagTestResult] = useState<TagTestResult | null>(
    null,
  );
  const tagTestAbortRef = useRef<AbortController | null>(null);

  const selectedSlot =
    slots.find((slot) => slot.id === selectedSlotId) ?? preview?.slot ?? null;
  const selectedSessionId = selectedSlot?.sessionId ?? null;
  const displayedTotal =
    count?.slotId === selectedSessionId
      ? count.total
      : (selectedSlot?.attendanceCount ?? 0);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextTag, overview] = await Promise.all([
        getRegisteredTag(),
        getOperatorAttendanceOverview(),
      ]);
      setTag(nextTag);
      setSlots(overview.slots);
      setPreview(overview.preview);
      setSelectedSlotId((current) => {
        if (current && overview.slots.some((slot) => slot.id === current)) {
          return current;
        }
        return overview.preview.slot?.id ?? null;
      });
    } catch {
      setError("Attendance could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCount = useCallback(async (sessionId: string) => {
    setCountLoading(true);
    try {
      setCount(await getLiveAttendanceCount(sessionId));
    } catch {
      toast.error("Attendance could not be refreshed");
    } finally {
      setCountLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadOverview(), 0);
    const refresh = () => void loadOverview();
    window.addEventListener(NFC_STATE_CHANGE_EVENT, refresh);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener(NFC_STATE_CHANGE_EVENT, refresh);
    };
  }, [loadOverview]);

  useEffect(() => {
    if (!selectedSessionId) return;
    const initialLoad = window.setTimeout(
      () => void loadCount(selectedSessionId),
      0,
    );
    const interval = window.setInterval(
      () => void loadCount(selectedSessionId),
      12_000,
    );
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadCount, selectedSessionId]);

  useEffect(() => () => tagTestAbortRef.current?.abort(), []);

  async function handleTestTag() {
    tagTestAbortRef.current?.abort();
    const controller = new AbortController();
    tagTestAbortRef.current = controller;
    setTagTestResult(null);
    setTagTestState("SCANNING");
    try {
      const url = await scanNdefUrl({ signal: controller.signal });
      const result = await testRegisteredTagUrl(url);
      if (tagTestAbortRef.current !== controller) return;
      setTagTestResult(result);
      setTagTestState(result.valid ? "VALID" : "INVALID");
    } catch (testError) {
      if (tagTestAbortRef.current !== controller) return;
      if (
        testError instanceof DOMException &&
        testError.name === "AbortError"
      ) {
        setTagTestState("IDLE");
        return;
      }
      setTagTestResult({
        valid: false,
        message:
          testError instanceof Error
            ? testError.message
            : "The NFC sticker could not be tested.",
      });
      setTagTestState("FAILED");
    }
  }

  function closeTagTest() {
    tagTestAbortRef.current?.abort();
    tagTestAbortRef.current = null;
    setTagTestResult(null);
    setTagTestState("IDLE");
  }

  async function handlePrepare() {
    setRegistrationError(null);
    setManuallyVerified(false);
    setPrepared(null);
    setStage("PREPARING");
    try {
      setPrepared(await prepareRegistration());
      setStage("PREPARED");
    } catch {
      setPrepared(null);
      setStage("PREPARE_FAILED");
      setRegistrationError("The registration could not be prepared.");
    }
  }

  async function handleWrite() {
    if (!prepared || Date.parse(prepared.expiresAt) <= Date.now()) {
      setStage("EXPIRED");
      return;
    }
    setRegistrationError(null);
    setStage("WRITING_WEB_NFC");
    try {
      await writePreparedTag(prepared);
      setStage("WRITTEN");
    } catch (writeError) {
      setStage("WRITE_FAILED");
      setRegistrationError(
        writeError instanceof Error
          ? writeError.message
          : "The sticker could not be written.",
      );
    }
  }

  async function handleConfirm() {
    if (!prepared || Date.parse(prepared.expiresAt) <= Date.now()) {
      setStage("EXPIRED");
      return;
    }
    if (method === "MANUAL" && !manuallyVerified) return;
    setRegistrationError(null);
    setStage("CONFIRMING");
    try {
      await confirmRegistration(prepared);
      setTag(await getRegisteredTag());
      setStage("READY");
      toast.success("Sticker registered");
    } catch {
      setStage("CONFIRM_FAILED");
      setRegistrationError(
        "Activation failed. Try again while the registration URL is still valid.",
      );
    }
  }

  function handleSelectMethod(nextMethod: RegistrationMethod) {
    setMethod(nextMethod);
    setRegistrationError(null);
    setManuallyVerified(false);
    if (prepared) setStage("PREPARED");
  }

  function handleCancel() {
    setPrepared(null);
    setMethod(null);
    setManuallyVerified(false);
    setRegistrationError(null);
    setStage("CHOOSE_METHOD");
    setRegistrationOpen(false);
    setTutorialOpen(false);
  }

  function handleSelectSlot(slot: AttendanceSlot) {
    setSelectedSlotId(slot.id);
    setPreview({
      slot,
      ambiguous: false,
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-5 sm:px-6">
      <AttendancePageHeader
        title="Manage attendance"
        description="Register your NFC sticker and view attendance for today's classes."
        action={<CapabilityBadge capabilities={capabilities} />}
      />

      {error && (
        <Alert variant="destructive">
          <CircleHelp size={16} aria-hidden="true" />
          <AlertTitle>Attendance unavailable</AlertTitle>
          <AlertDescription>
            {error}{" "}
            <button
              className="font-medium underline"
              onClick={() => void loadOverview()}
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      )}

      <NfcTagStatusCard
        tag={tag}
        onTest={() => void handleTestTag()}
        onRegister={() => {
          closeTagTest();
          setRegistrationOpen(true);
          setStage("CHOOSE_METHOD");
          setMethod(null);
          setPrepared(null);
          setManuallyVerified(false);
          setRegistrationError(null);
        }}
        busy={registrationOpen && stage !== "READY"}
        testing={tagTestState === "SCANNING"}
      />

      {tagTestState !== "IDLE" && (
        <NfcTagTestResult
          state={tagTestState}
          result={tagTestResult}
          onCancel={closeTagTest}
          onRetry={() => void handleTestTag()}
        />
      )}

      {registrationOpen && (
        <RegistrationStepper
          stage={stage}
          method={method}
          prepared={prepared}
          capabilities={capabilities}
          error={registrationError}
          manuallyVerified={manuallyVerified}
          hasCurrentTag={tag !== null}
          onSelectMethod={handleSelectMethod}
          onPrepare={() => void handlePrepare()}
          onWrite={() => void handleWrite()}
          onConfirm={() => void handleConfirm()}
          onManualVerifiedChange={setManuallyVerified}
          onOpenTutorial={() => setTutorialOpen(true)}
          onExpire={() => {
            setStage("EXPIRED");
            setManuallyVerified(false);
          }}
          onCancel={handleCancel}
        />
      )}

      <NfcRegistrationTutorial
        open={tutorialOpen}
        prepared={prepared !== null}
        preparing={stage === "PREPARING"}
        onOpenChange={setTutorialOpen}
        onPrepare={() => {
          if (!method) setMethod("MANUAL");
          void handlePrepare();
        }}
      />

      <Card className="border-[var(--border)] bg-[var(--bg-surface)]">
        <CardContent className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Selected class
          </h2>
          {loading ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Loading current class…
            </p>
          ) : selectedSlot ? (
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {selectedSlot.moduleCode} · {selectedSlot.moduleName}
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {selectedSlot.venue}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              {preview?.ambiguous
                ? "More than one class is running. Select the class for this sticker below."
                : "No class is currently running."}
            </p>
          )}
          <AttendanceCountTile
            total={displayedTotal}
            updatedAt={
              count?.slotId === selectedSessionId ? count.updatedAt : undefined
            }
            loading={countLoading && !!selectedSessionId && !count}
          />
        </CardContent>
      </Card>

      <section className="space-y-3" aria-labelledby="today-slots-heading">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="today-slots-heading"
            className="text-base font-semibold text-[var(--text-primary)]"
          >
            Today&apos;s classes
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void loadOverview()}
            disabled={loading}
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin" : ""}
              aria-hidden="true"
            />{" "}
            Refresh
          </Button>
        </div>
        {slots.length === 0 && !loading ? (
          <p className="text-sm text-[var(--text-secondary)]">
            No classes are scheduled for today.
          </p>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => (
              <SlotSummaryCard
                key={slot.id}
                slot={slot}
                selected={slot.id === selectedSlotId}
                onSelect={() => handleSelectSlot(slot)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
