import { Nfc, RotateCcw } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { AttendanceStatusPill } from "@/components/atoms/attendance/AttendanceStatusPill";
import type { RegisteredNfcTag } from "@/lib/nfc_attendance/types";

export function NfcTagStatusCard({
  tag,
  onRegister,
  onTest,
  busy = false,
  testing = false,
}: {
  tag: RegisteredNfcTag | null;
  onRegister: () => void;
  onTest: () => void;
  busy?: boolean;
  testing?: boolean;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--bg-surface)]">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            NFC sticker
          </h2>
          <AttendanceStatusPill status={tag ? "READY" : "NOT_REGISTERED"} />
        </div>
        {tag ? (
          <>
            <p className="text-sm text-[var(--text-secondary)]">
              Sticker{" "}
              <span className="font-mono text-[var(--text-primary)]">
                {tag.displayId}
              </span>{" "}
              is ready to use for your classes.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onTest} disabled={busy || testing}>
                <Nfc size={14} aria-hidden="true" />
                {testing ? "Scanning…" : "Test tag"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRegister}
                disabled={busy}
              >
                <RotateCcw size={14} aria-hidden="true" /> Register replacement
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Register a sticker before students can check in.
            </p>
            <Button onClick={onRegister} disabled={busy}>
              Register sticker
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
