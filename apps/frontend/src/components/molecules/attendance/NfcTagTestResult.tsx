import { Nfc } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/atoms/baseShadcn/alert";
import { Button } from "@/components/atoms/baseShadcn/button";
import type {
  NfcTagTestResult as TestResult,
  NfcTagTestState,
} from "@/lib/nfc_attendance/types";

export function NfcTagTestResult({
  state,
  result,
  onCancel,
  onRetry,
}: {
  state: Exclude<NfcTagTestState, "IDLE">;
  result: TestResult | null;
  onCancel: () => void;
  onRetry: () => void;
}) {
  if (state === "SCANNING") {
    return (
      <Alert>
        <Nfc aria-hidden="true" />

        <AlertTitle>Waiting for sticker</AlertTitle>

        <AlertDescription className="space-y-3">
          <p>Hold this phone near the NFC sticker until it is detected.</p>

          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const valid = state === "VALID";

  return (
    <Alert variant={valid ? "success" : "destructive"}>
      <AlertTitle>
        {valid ? "Sticker verified" : "Sticker could not be verified"}
      </AlertTitle>

      <AlertDescription className="space-y-3">
        <p>{result?.message ?? "UMTAS could not verify this sticker."}</p>

        {valid && result?.displayId && (
          <div className="rounded-lg border border-current/20 p-3">
            <p className="text-xs opacity-80">Sticker ID</p>

            <p className="mt-1 font-mono text-xs">{result.displayId}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onRetry}>
            Test again
          </Button>

          <Button variant="ghost" size="sm" onClick={onCancel}>
            Close
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
