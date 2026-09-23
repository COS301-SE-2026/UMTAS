"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/atoms/baseShadcn/button";
import { CapabilityBadge } from "@/components/molecules/attendance/CapabilityBadge";
import { AttendancePageHeader } from "@/components/molecules/attendance/AttendancePageHeader";
import { NfcRegistrationTutorial } from "@/components/molecules/attendance/NfcRegistrationTutorial";
import { NfcTagStatusCard } from "@/components/molecules/attendance/NfcTagStatusCard";
import { NfcTagTestResult } from "@/components/molecules/attendance/NfcTagTestResult";
import { RegistrationStepper } from "@/components/molecules/attendance/RegistrationStepper";
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
import { getRegisteredTag } from "@/lib/nfc_attendance/nfc_api";
import { scanNdefUrl } from "@/lib/nfc_attendance/web_nfc";
import type {
  NfcTagTestResult as TagTestResult,
  NfcTagTestState,
  PreparedNfcRegistration,
  RegisteredNfcTag,
  RegistrationMethod,
  RegistrationStage,
} from "@/lib/nfc_attendance/types";

export function NfcTagRegistrationPanel() {
  const capabilities = useSyncExternalStore(
    () => () => {},
    getNfcCapabilities,
    getServerNfcCapabilities,
  );
  const [tag, setTag] = useState<RegisteredNfcTag | null>(null);
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

  useEffect(() => {
    void getRegisteredTag()
      .then(setTag)
      .catch(() => {
        toast.error("NFC sticker status could not be loaded");
      });
    return () => tagTestAbortRef.current?.abort();
  }, []);

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
    } catch (error) {
      if (tagTestAbortRef.current !== controller) return;
      if (error instanceof DOMException && error.name === "AbortError") {
        setTagTestState("IDLE");
        return;
      }
      setTagTestResult({
        valid: false,
        message:
          error instanceof Error
            ? error.message
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
    } catch (error) {
      setStage("WRITE_FAILED");
      setRegistrationError(
        error instanceof Error
          ? error.message
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

  function handleCancel() {
    setPrepared(null);
    setMethod(null);
    setManuallyVerified(false);
    setRegistrationError(null);
    setStage("CHOOSE_METHOD");
    setRegistrationOpen(false);
    setTutorialOpen(false);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-5 sm:px-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/attendance">
          <ArrowLeft size={14} aria-hidden="true" /> Back to attendance
        </Link>
      </Button>
      <AttendancePageHeader
        title="Register NFC sticker"
        description="Register, replace, and test the sticker students use to check in."
        action={<CapabilityBadge capabilities={capabilities} />}
      />

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
          onSelectMethod={(nextMethod) => {
            setMethod(nextMethod);
            setRegistrationError(null);
            setManuallyVerified(false);
            if (prepared) setStage("PREPARED");
          }}
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
    </div>
  );
}
