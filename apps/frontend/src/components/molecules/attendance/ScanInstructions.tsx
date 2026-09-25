import { Nfc } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import type { NfcCapabilities } from "@/lib/nfc_attendance/types";

export function ScanInstructions({
  capabilities,
  onScan,
  scanning,
}: {
  capabilities: NfcCapabilities;
  onScan: () => void;
  scanning: boolean;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
      <CardHeader className="border-b border-[var(--border)]">
        <CardTitle className="text-lg">Check in with NFC</CardTitle>

        <CardDescription>
          Use the lecturer&apos;s NFC sticker to record your attendance.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        {capabilities.canRead ? (
          <>
            <div className="grid gap-3">
              <Instruction
                number={1}
                title="Start the scanner"
                description="Tap the button below and allow NFC access if your browser asks."
              />

              <Instruction
                number={2}
                title="Hold your phone near the sticker"
                description="Keep the phone close until UMTAS confirms the check-in."
              />
            </div>

            <Button onClick={onScan} disabled={scanning}>
              <Nfc size={16} aria-hidden="true" />
              {scanning ? "Waiting for sticker…" : "Start scan"}
            </Button>
          </>
        ) : (
          <div className="grid gap-3">
            <Instruction
              number={1}
              title="Tap the NFC sticker"
              description="Hold your unlocked phone near the lecturer's sticker."
            />

            <Instruction
              number={2}
              title="Open the notification"
              description="Open the link shown by your phone to continue with attendance check-in."
            />

            <p className="text-xs text-[var(--text-secondary)]">
              Direct Web NFC scanning requires Android Chrome over HTTPS.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Instruction({
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
