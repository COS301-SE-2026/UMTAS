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
          <DialogTitle>How to write an NFC sticker</DialogTitle>
          <DialogDescription>
            Use NFC Tools to write the attendance link, then verify it before
            activating the sticker in UMTAS.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-4 text-sm text-[var(--text-secondary)]">
          <li>
            <strong className="text-[var(--text-primary)]">
              1. Install NFC Tools.
            </strong>{" "}
            Install NFC Tools by wakdev. UMTAS uses it only to write the
            provided attendance link to your sticker. The App Store listing
            supports iPhone 7 or later.
            <div className="mt-2">
              <Button asChild variant="outline" size="sm">
                <a href={APP_STORE_URL} target="_blank" rel="noreferrer">
                  Open in the App Store <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            </div>
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">
              2. Generate the URL.
            </strong>{" "}
            It is valid for about ten minutes. Generating it does not replace
            your current sticker.
            {!prepared && (
              <div className="mt-2">
                <Button onClick={onPrepare} disabled={preparing}>
                  {preparing ? "Generating…" : "Generate registration URL"}
                </Button>
              </div>
            )}
            {prepared && (
              <p className="mt-2 font-medium text-[var(--success-text)]">
                The URL is ready in the registration panel.
              </p>
            )}
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">
              3. Copy the full URL.
            </strong>{" "}
            Close this guide and use Copy URL in UMTAS.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">
              4. Add a URL record.
            </strong>{" "}
            In NFC Tools, open Write, choose Add a record, select the URL/URI
            record type, paste the link, save the record, then choose Write.
            Labels can vary slightly between app versions.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">
              5. Write the sticker.
            </strong>{" "}
            Hold the top of the iPhone near the sticker until NFC Tools reports
            that the write succeeded.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">
              6. Read it back.
            </strong>{" "}
            Use Read in NFC Tools and check that the saved URL exactly matches
            the complete URL shown in UMTAS.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">
              7. Activate it.
            </strong>{" "}
            Return to UMTAS, acknowledge that you verified the readback, and
            activate. This is the step that replaces the previous sticker.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">
              8. Test a normal tap.
            </strong>{" "}
            Tap the sticker normally and confirm that it opens the attendance
            check-in page on the public HTTPS address.
          </li>
        </ol>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back to registration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
