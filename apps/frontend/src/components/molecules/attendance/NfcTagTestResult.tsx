import { CheckCircle2, Nfc, XCircle } from "lucide-react";
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
        <AlertTitle>Ready to scan</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>Hold this phone near your registered sticker.</p>
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
      {valid ? (
        <CheckCircle2 aria-hidden="true" />
      ) : (
        <XCircle aria-hidden="true" />
      )}
      <AlertTitle>{valid ? "Tag works" : "Tag test failed"}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{result?.message ?? "The sticker could not be verified."}</p>
        {valid && result?.displayId && (
          <p className="font-mono text-xs">{result.displayId}</p>
        )}
        <div className="flex gap-2">
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
