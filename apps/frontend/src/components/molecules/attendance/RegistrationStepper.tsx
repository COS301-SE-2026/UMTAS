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
import { useState } from "react";

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

  const activationStage = ["WRITTEN", "CONFIRM_FAILED", "CONFIRMING"].includes(
    stage,
  );
  const [copiedTagId, setCopiedTagId] = useState<string | null>(null);

  const linkCopied = prepared ? copiedTagId === prepared.tagId : false;

  const currentStep =
    stage === "READY"
      ? 4
      : activationStage || manuallyVerified
        ? 4
        : prepared
          ? 3
          : method
            ? 2
            : 1;

  return (
    <Card className="border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Register an NFC sticker
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
              Follow the four steps below to prepare and activate the sticker.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AttendanceStatusPill status={stage} />

            {stage !== "READY" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                disabled={busy}
                aria-label="Cancel registration"
              >
                <X size={16} aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <RegistrationStep
            number={1}
            title="Choose method"
            active={currentStep === 1}
            complete={currentStep > 1}
          />

          <RegistrationStep
            number={2}
            title="Generate link"
            active={currentStep === 2}
            complete={currentStep > 2}
          />

          <RegistrationStep
            number={3}
            title="Write sticker"
            active={currentStep === 3}
            complete={currentStep > 3}
          />

          <RegistrationStep
            number={4}
            title="Verify and activate"
            active={currentStep === 4}
            complete={stage === "READY"}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <X size={16} aria-hidden="true" />

            <AlertTitle>Registration did not finish</AlertTitle>

            <AlertDescription>
              {error}{" "}
              {hasCurrentTag &&
                "Your current sticker is still active. It will only be replaced after the new sticker is activated."}
            </AlertDescription>
          </Alert>
        )}

        {!method && stage !== "READY" && (
          <section className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)]">
                Step 1
              </p>

              <h3 className="mt-1 text-[15px] font-medium text-[var(--text-primary)]">
                Choose how to write the sticker
              </h3>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Use this device when Web NFC is available. Otherwise use NFC
                Tools for manual setup.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                variant={capabilities.canWrite ? "default" : "outline"}
                className="h-auto min-h-20 justify-start gap-3 p-4 text-left"
                onClick={() => onSelectMethod("WEB_NFC")}
                disabled={!capabilities.canWrite}
              >
                <Nfc className="size-5 shrink-0" aria-hidden="true" />

                <span>
                  <span className="block font-medium">Use this device</span>
                  <span className="mt-1 block text-xs font-normal opacity-80">
                    Write the sticker directly with Web NFC
                  </span>
                </span>
              </Button>

              <Button
                variant={!capabilities.canWrite ? "default" : "outline"}
                className="h-auto min-h-20 justify-start gap-3 p-4 text-left"
                onClick={() => onSelectMethod("MANUAL")}
              >
                <Smartphone className="size-5 shrink-0" aria-hidden="true" />

                <span>
                  <span className="block font-medium">Manual setup</span>
                  <span className="mt-1 block text-xs font-normal opacity-80">
                    Write the link with NFC Tools
                  </span>
                </span>
              </Button>
            </div>

            {!capabilities.canWrite && (
              <p className="text-xs text-[var(--text-secondary)]">
                Direct writing requires Android Chrome. Manual setup can be used
                on other supported phones.
              </p>
            )}
          </section>
        )}

        {method && !prepared && stage !== "READY" && (
          <section className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)]">
                Step 2
              </p>

              <h3 className="mt-1 text-[15px] font-medium text-[var(--text-primary)]">
                Generate the registration link
              </h3>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {method === "WEB_NFC"
                  ? "UMTAS will create a temporary link and then ask you to hold this device near the sticker."
                  : "UMTAS will create a temporary link that you can copy into NFC Tools. Generate it when you are ready to write the sticker."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={onPrepare} disabled={stage === "PREPARING"}>
                {stage === "PREPARING"
                  ? "Generating…"
                  : "Generate registration link"}
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
          </section>
        )}

        {prepared && stage !== "READY" && (
          <section className="space-y-5">
            <PreparedTagUrl
              key={prepared.tagId}
              registration={prepared}
              expired={expired}
              onExpire={onExpire}
              onCopied={() => setCopiedTagId(prepared.tagId)}
            />

            {expired ? (
              <Alert>
                <AlertTitle>Registration link expired</AlertTitle>

                <AlertDescription>
                  Generate a new link before writing the sticker. Your current
                  sticker has not changed.
                </AlertDescription>
              </Alert>
            ) : method === "WEB_NFC" ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)]">
                    Step 3
                  </p>

                  <h3 className="mt-1 text-[15px] font-medium text-[var(--text-primary)]">
                    Write the sticker
                  </h3>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Hold this device near the NFC sticker while UMTAS writes the
                    registration link.
                  </p>
                </div>

                {stage === "WRITING_WEB_NFC" && (
                  <p
                    className="text-sm font-medium text-[var(--text-primary)]"
                    role="status"
                  >
                    Writing sticker… Keep the device close to the sticker.
                  </p>
                )}

                {stage === "WRITTEN" || stage === "CONFIRM_FAILED" ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)]">
                        Step 4
                      </p>

                      <h3 className="mt-1 text-[15px] font-medium text-[var(--text-primary)]">
                        Activate the sticker
                      </h3>
                    </div>

                    <Button onClick={onConfirm}>Activate sticker</Button>
                  </div>
                ) : stage !== "CONFIRMING" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={onWrite} disabled={!capabilities.canWrite}>
                      Write sticker
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => onSelectMethod("MANUAL")}
                    >
                      Use manual setup
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                {linkCopied && !manuallyVerified && (
                  <>
                    <div>
                      <h3 className="text-[15px] font-medium text-[var(--text-primary)]">
                        Write the sticker
                      </h3>

                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Open NFC Tools, add a URL record, paste the copied link
                        and write it to the sticker.
                      </p>
                    </div>

                    <label className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 text-sm text-[var(--text-primary)]">
                      <Checkbox
                        checked={manuallyVerified}
                        onCheckedChange={(checked) =>
                          onManualVerifiedChange(checked === true)
                        }
                      />

                      <span>
                        I wrote the sticker and verified the saved URL.
                      </span>
                    </label>
                  </>
                )}

                {manuallyVerified && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-[15px] font-medium text-[var(--text-primary)]">
                        Activate the sticker
                      </h3>

                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Your sticker is ready to activate.
                      </p>
                    </div>

                    <Button onClick={onConfirm}>Activate sticker</Button>
                  </div>
                )}
              </div>
            )}

            {stage === "CONFIRMING" && (
              <p
                className="text-sm font-medium text-[var(--text-primary)]"
                role="status"
              >
                Activating sticker…
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onOpenTutorial}>
                <BookOpen size={16} aria-hidden="true" />
                Open setup guide
              </Button>

              {expired && (
                <Button size="sm" onClick={onPrepare}>
                  Generate new link
                </Button>
              )}
            </div>
          </section>
        )}

        {stage === "READY" && (
          <Alert variant="success">
            <AlertTitle>Sticker registered</AlertTitle>

            <AlertDescription>
              The sticker is active. Test a normal tap to confirm that it opens
              the attendance check-in page.
            </AlertDescription>
          </Alert>
        )}

        {!prepared && stage !== "READY" && (
          <Button variant="outline" size="sm" onClick={onOpenTutorial}>
            <BookOpen size={16} aria-hidden="true" />
            View setup guide
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function RegistrationStep({
  number,
  title,
  active,
  complete,
}: {
  number: number;
  title: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={`border-l-2 px-3 py-2 ${
        active ? "border-[var(--text-primary)]" : "border-[var(--border)]"
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)]">
        Step {number}
      </p>

      <p className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">
        {title}
      </p>

      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
        {complete ? "Complete" : active ? "Current step" : "Not started"}
      </p>
    </div>
  );
}

function InstructionRow({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-lg border border-[var(--border)] p-3">
      <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--bg-elevated)] text-sm font-medium text-[var(--text-primary)]">
        {number}
      </div>

      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {title}
        </p>

        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}
