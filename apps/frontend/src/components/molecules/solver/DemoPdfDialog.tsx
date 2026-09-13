"use client";

import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/atoms/baseShadcn/alert";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Card } from "@/components/atoms/baseShadcn/card";
import Popup from "@/components/atoms/utility/floatContainer";
import { Spinner } from "@/components/atoms/baseShadcn/spinner";
import { demoPdf } from "@/app/solver/queries/PDF/queries";

interface DemoPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileReady: (file: File) => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes("503")) {
    return "The demo PDF isn't available right now — you can still upload your own.";
  }

  return "We couldn't load the demo PDF. Please try again or upload your own.";
}

export default function DemoPdfDialog({
  open,
  onOpenChange,
  onFileReady,
}: DemoPdfDialogProps) {
  const demoPdfMutation = useMutation(demoPdf());

  if (!open) return null;

  async function handleUseDemoPdf() {
    try {
      const file = await demoPdfMutation.mutateAsync();
      onFileReady(file);
      onOpenChange(false);
    } catch {
      // The mutation error is rendered inline so the dialog stays open for retry.
    }
  }

  return (
    <Popup
      onClose={() => {
        if (!demoPdfMutation.isPending) {
          onOpenChange(false);
        }
      }}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-pdf-title"
        className="w-full max-w-md p-6 flex flex-col gap-4 border-[var(--border)] bg-[var(--bg-surface)] shadow-lg"
      >
        <div className="flex flex-col gap-2">
          <h2
            id="demo-pdf-title"
            className="text-lg font-semibold text-[var(--text-primary)]"
          >
            No timetable PDF handy?
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Use our University of Pretoria sample timetable to try the full flow
            — nothing to download or find on your device.
          </p>
        </div>

        {demoPdfMutation.isError && (
          <Alert variant="destructive" aria-live="polite">
            <AlertDescription>
              {getErrorMessage(demoPdfMutation.error)}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            data-testid="btn-decline-demo-pdf"
            type="button"
            variant="outline"
            disabled={demoPdfMutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            I&apos;ll upload my own
          </Button>
          <Button
            data-testid="btn-use-demo-pdf"
            type="button"
            disabled={demoPdfMutation.isPending}
            onClick={() => void handleUseDemoPdf()}
          >
            {demoPdfMutation.isPending && <Spinner />}
            {demoPdfMutation.isPending ? "Loading demo PDF…" : "Use a demo PDF"}
          </Button>
        </div>
      </Card>
    </Popup>
  );
}
