import { Nfc, RotateCcw } from "lucide-react";
import Link from "next/link";

import { AttendanceStatusPill } from "@/components/atoms/attendance/AttendanceStatusPill";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import type { RegisteredNfcTag } from "@/lib/nfc_attendance/types";

export function NfcTagStatusCard({
  tag,
  onRegister,
  onTest,
  registerHref,
  busy = false,
  testing = false,
}: {
  tag: RegisteredNfcTag | null;
  onRegister?: () => void;
  onTest?: () => void;
  registerHref?: string;
  busy?: boolean;
  testing?: boolean;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--bg-surface)] shadow-none">
      <CardHeader className="space-y-0 border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-[15px] font-medium text-[var(--text-primary)]">
              NFC sticker
            </CardTitle>

            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Sticker used for attendance check-in
            </p>
          </div>

          <AttendanceStatusPill status={tag ? "READY" : "NOT_REGISTERED"} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 py-4">
        {tag ? (
          <>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Sticker ID
                </p>

                <p className="mt-0.5 font-mono text-sm font-medium text-[var(--text-primary)]">
                  {tag.displayId}
                </p>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                Ready for attendance
              </p>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
              {onTest && (
                <Button size="sm" onClick={onTest} disabled={busy || testing}>
                  <Nfc size={16} aria-hidden="true" />
                  {testing ? "Scanning…" : "Test sticker"}
                </Button>
              )}

              {registerHref ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={registerHref}>
                    <RotateCcw size={16} aria-hidden="true" />
                    Replace sticker
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegister}
                  disabled={busy}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  Replace sticker
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                No sticker registered
              </p>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Register an NFC sticker before using NFC attendance.
              </p>
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              {registerHref ? (
                <Button asChild size="sm">
                  <Link href={registerHref}>Register sticker</Link>
                </Button>
              ) : (
                <Button size="sm" onClick={onRegister} disabled={busy}>
                  Register sticker
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
