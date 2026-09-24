"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/baseShadcn/dialog";

const APP_STORE_URL = "https://apps.apple.com/us/app/nfc-tools/id1252962749";

export function NfcRegistrationTutorial({
  open,
  prepared,
  preparing,
  onOpenChange,
  onPrepare,
}: {
  open: boolean;
  prepared: boolean;
  preparing: boolean;
  onOpenChange: (open: boolean) => void;
  onPrepare: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-dvh max-w-none overflow-y-auto rounded-none sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-xl">
        <DialogHeader>
          <DialogTitle>Set up an NFC sticker</DialogTitle>

          <DialogDescription>
            Follow these steps to write the attendance link and activate the
            sticker in UMTAS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <TutorialStep number={1} title="Install NFC Tools">
            <p>
              Install NFC Tools by wakdev. You will use it to write the UMTAS
              attendance link to the sticker.
            </p>

            <Button asChild variant="outline" size="sm" className="mt-3">
              <a href={APP_STORE_URL} target="_blank" rel="noreferrer">
                Open App Store
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            </Button>
          </TutorialStep>

          <TutorialStep number={2} title="Generate the registration link">
            <p>
              Generate the link when you are ready to write the sticker. The
              link is temporary and does not replace your current sticker.
            </p>

            {!prepared && (
              <Button className="mt-3" onClick={onPrepare} disabled={preparing}>
                {preparing ? "Generating…" : "Generate registration link"}
              </Button>
            )}

            {prepared && (
              <p className="mt-3 font-medium text-[var(--text-primary)]">
                The registration link is ready.
              </p>
            )}
          </TutorialStep>

          <TutorialStep number={3} title="Add the link in NFC Tools">
            <p>
              Copy the full UMTAS link. In NFC Tools open Write, add a URL or
              URI record, and paste the complete link.
            </p>
          </TutorialStep>

          <TutorialStep number={4} title="Write the sticker">
            <p>
              Choose Write in NFC Tools and hold the phone near the sticker
              until the app confirms that writing finished.
            </p>
          </TutorialStep>

          <TutorialStep number={5} title="Read and verify">
            <p>
              Open Read in NFC Tools and scan the sticker again. Confirm that
              the saved link exactly matches the link shown in UMTAS.
            </p>
          </TutorialStep>

          <TutorialStep number={6} title="Activate and test">
            <p>
              Return to UMTAS and activate the sticker. Then tap the sticker
              normally and confirm that it opens the attendance check-in page.
            </p>
          </TutorialStep>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back to registration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TutorialStep({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-lg border border-[var(--border)] p-4">
      <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--bg-elevated)] text-sm font-semibold text-[var(--text-primary)]">
        {number}
      </div>

      <div>
        <h3 className="text-sm font-medium text-[var(--text-primary)]">
          {title}
        </h3>

        <div className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
          {children}
        </div>
      </div>
    </section>
  );
}
