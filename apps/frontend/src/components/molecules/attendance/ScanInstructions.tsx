import { Nfc } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
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
    <Card className="border-[var(--border)] bg-[var(--bg-surface)]">
      <CardHeader className="border-b border-[var(--border)]">
        <CardTitle className="text-[var(--text-primary)]">
          Scan NFC sticker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">
          {scanning
            ? "Hold your phone near the lecturer's sticker."
            : "Start scanning, then hold your unlocked phone near the lecturer's sticker."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onScan} disabled={scanning || !capabilities.canRead}>
            <Nfc size={16} aria-hidden="true" />{" "}
            {scanning ? "Scanning…" : "Start scan"}
          </Button>
        </div>
        {!capabilities.canRead && (
          <p className="text-xs text-[var(--text-secondary)]">
            Web NFC requires Android Chrome over HTTPS. On other phones, tap the
            sticker and open the notification to check in.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
