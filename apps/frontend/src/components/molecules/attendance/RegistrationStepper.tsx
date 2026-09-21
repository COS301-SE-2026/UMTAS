import { BookOpen, Nfc, Smartphone, X } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/atoms/baseShadcn/alert";
import { Checkbox } from "@/components/atoms/baseShadcn/checkbox";
import { AttendanceStatusPill } from "@/components/atoms/attendance/AttendanceStatusPill";
import { PreparedTagUrl } from "@/components/molecules/attendance/PreparedTagUrl";
import type {
  NfcCapabilities,
  PreparedNfcRegistration,
  RegistrationMethod,
  RegistrationStage,
} from "@/lib/nfc_attendance/types";

export function RegistrationStepper({
  stage,
  method,
  prepared,
  capabilities,
  error,
  manuallyVerified,
  hasCurrentTag,
  onSelectMethod,
  onPrepare,
  onWrite,
  onConfirm,
  onManualVerifiedChange,
  onOpenTutorial,
  onExpire,
  onCancel,
}: {
  stage: RegistrationStage;
  method: RegistrationMethod | null;
  prepared: PreparedNfcRegistration | null;
  capabilities: NfcCapabilities;
  error: string | null;
  manuallyVerified: boolean;
  hasCurrentTag: boolean;
  onSelectMethod: (method: RegistrationMethod) => void;
  onPrepare: () => void;
  onWrite: () => void;
  onConfirm: () => void;
  onManualVerifiedChange: (verified: boolean) => void;
  onOpenTutorial: () => void;
  onExpire: () => void;
  onCancel: () => void;
}) {
  const expired = stage === "EXPIRED";
  const busy = ["PREPARING", "WRITING_WEB_NFC", "CONFIRMING"].includes(stage);

  return (
    <Card className="border-[var(--border)] bg-[var(--bg-surface)]">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Register a new sticker
          </h2>
          <AttendanceStatusPill status={stage} />
        </div>
        {error && (
          <Alert variant="destructive">
            <X size={16} aria-hidden="true" />
            <AlertTitle>Registration did not finish</AlertTitle>
            <AlertDescription>
              {error}{" "}
              {hasCurrentTag &&
                "Your current sticker remains active until activation succeeds."}
            </AlertDescription>
          </Alert>
        )}

        {!method && stage !== "READY" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                Choose how to write the sticker
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Both methods use the same secure, temporary registration URL.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={capabilities.canWrite ? "default" : "outline"}
                onClick={() => onSelectMethod("WEB_NFC")}
                disabled={!capabilities.canWrite}
              >
                <Nfc aria-hidden="true" /> Write with this device
              </Button>
              <Button
                variant={!capabilities.canWrite ? "default" : "outline"}
                onClick={() => onSelectMethod("MANUAL")}
              >
                <Smartphone aria-hidden="true" /> Set up manually
              </Button>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {capabilities.canWrite
                ? "Direct writing is available on this device."
                : "Direct writing requires Android Chrome; manual setup works everywhere."}
            </p>
          </div>
        )}

        {method && !prepared && stage !== "READY" && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              {method === "WEB_NFC"
                ? "Generate the sticker details, then UMTAS will ask you to hold this device near the sticker."
                : "Install and review NFC Tools first. Generate the URL only when you are ready to write it; it expires after about ten minutes."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onPrepare} disabled={stage === "PREPARING"}>
                {stage === "PREPARING"
                  ? "Generating…"
                  : "Generate registration URL"}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  onSelectMethod(method === "WEB_NFC" ? "MANUAL" : "WEB_NFC")
                }
                disabled={method === "MANUAL" && !capabilities.canWrite}
              >
                Switch method
              </Button>
            </div>
          </div>
        )}

        {prepared && stage !== "READY" && (
          <div className="space-y-4">
            <PreparedTagUrl
              key={prepared.tagId}
              registration={prepared}
              expired={expired}
              onExpire={onExpire}
            />

            {expired ? (
              <Alert>
                <AlertTitle>Registration URL expired</AlertTitle>
                <AlertDescription>
                  It cannot be written or activated. Any existing sticker is
                  unchanged.
                </AlertDescription>
              </Alert>
            ) : method === "WEB_NFC" ? (
              <div className="space-y-3">
                {stage === "WRITING_WEB_NFC" && (
                  <p
                    className="text-sm text-[var(--text-secondary)]"
                    role="status"
                  >
                    Writing sticker… Hold this device near the NFC sticker.
                  </p>
                )}
                {stage === "WRITTEN" || stage === "CONFIRM_FAILED" ? (
                  <Button onClick={onConfirm}>Activate sticker</Button>
                ) : stage !== "CONFIRMING" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={onWrite} disabled={!capabilities.canWrite}>
                      Write sticker with this device
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onSelectMethod("MANUAL")}
                    >
                      Use manual setup instead
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  After writing, use NFC Tools&apos; Read function and compare
                  the complete saved URL with the UMTAS URL above.
                </p>
                <label className="flex items-start gap-3 text-sm text-[var(--text-primary)]">
                  <Checkbox
                    checked={manuallyVerified}
                    onCheckedChange={(checked) =>
                      onManualVerifiedChange(checked === true)
                    }
                  />
                  <span>
                    I verified the URL and wrote the intended sticker.
                  </span>
                </label>
                <Button onClick={onConfirm} disabled={!manuallyVerified}>
                  I verified the URL and wrote the sticker — activate it
                </Button>
                {hasCurrentTag && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    Activation replaces your current sticker. Until it succeeds,
                    your current sticker remains active.
                  </p>
                )}
              </div>
            )}

            {stage === "CONFIRMING" && (
              <p className="text-sm text-[var(--text-secondary)]" role="status">
                Activating sticker…
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onOpenTutorial}>
                <BookOpen aria-hidden="true" /> Open tutorial
              </Button>
              {expired && (
                <Button size="sm" onClick={onPrepare}>
                  Generate a new URL
                </Button>
              )}
            </div>
          </div>
        )}

        {stage === "READY" && (
          <Alert variant="success">
            <AlertTitle>Sticker registered</AlertTitle>
            <AlertDescription>
              Tap it normally and confirm that it opens the attendance check-in
              page.
            </AlertDescription>
          </Alert>
        )}

        {!prepared && stage !== "READY" && (
          <Button variant="outline" size="sm" onClick={onOpenTutorial}>
            <BookOpen aria-hidden="true" /> How to write an NFC sticker
          </Button>
        )}

        {stage !== "READY" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={busy}
            className="text-[var(--text-secondary)]"
          >
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
