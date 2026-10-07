"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { GoogleIcon } from "@/components/atoms/auth/GoogleIcon";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/atoms/baseShadcn/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/atoms/baseShadcn/alert-dialog";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { useLinkedAccounts } from "@/app/account/queries/useLinkedAccounts";
import { useRevokeGoogleAccess } from "@/app/account/queries/useRevokeGoogleAccess";

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly":
    "See the list of calendars you can write to",
  "https://www.googleapis.com/auth/calendar.calendars":
    "Create a calendar named “UMTAS”",
  "https://www.googleapis.com/auth/calendar.events":
    "Add, change and remove events (UMTAS only uses its own “UMTAS” calendar)",
};

const ERROR_ALERT_CLASSES =
  "border-[var(--error-text)] bg-[var(--error-bg)] text-[var(--error-text)]";

export function ConnectedAccountsPanel() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const linkedAccounts = useLinkedAccounts();
  const revoke = useRevokeGoogleAccess();

  const googleAccount = linkedAccounts.data?.find(
    (account) => account.providerId === "google",
  );
  const permissions = Object.entries(SCOPE_DESCRIPTIONS)
    .filter(([scope]) => googleAccount?.scopes.includes(scope))
    .map(([, description]) => description);
  const hasCalendarAccess = permissions.length > 0;

  function handleConfirm() {
    revoke.mutate(undefined, { onSuccess: () => setIsConfirmOpen(false) });
  }

  return (
    <Card className="ph-no-capture border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-low)]">
      <CardHeader>
        <CardTitle className="text-[18px] font-semibold leading-[1.4] text-[var(--text-primary)]">
          Connected accounts
        </CardTitle>
        <CardDescription className="text-[14px] leading-[1.6] text-[var(--text-secondary)]">
          Review what UMTAS can do in your Google account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {linkedAccounts.isLoading && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-56" />
          </div>
        )}

        {linkedAccounts.isError && (
          <Alert className={ERROR_ALERT_CLASSES}>
            <AlertCircle size={16} aria-hidden="true" />
            <AlertTitle>We could not load your connected accounts</AlertTitle>
            <AlertDescription className="text-[var(--error-text)]">
              Check your connection and try again. If it keeps failing, you can
              manage UMTAS in your{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Account permissions
              </a>
              .
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void linkedAccounts.refetch()}
                >
                  Try again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {linkedAccounts.isSuccess && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0" aria-hidden="true">
                <GoogleIcon />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[15px] font-medium leading-[1.4] text-[var(--text-primary)]">
                    Google
                  </h3>
                  <Badge
                    variant="outline"
                    className="border-[var(--border)] text-[var(--text-primary)]"
                  >
                    {googleAccount ? "Connected" : "Not connected"}
                  </Badge>
                </div>
                {permissions.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-[14px] leading-[1.6] text-[var(--text-primary)]">
                    {permissions.map((permission) => (
                      <li key={permission}>{permission}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[14px] leading-[1.6] text-[var(--text-secondary)]">
                    No Google Calendar permissions granted.
                  </p>
                )}
              </div>
            </div>
            {hasCalendarAccess && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConfirmOpen(true)}
              >
                Remove Google Calendar access
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="ph-no-capture">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Google Calendar access?</AlertDialogTitle>
            <AlertDialogDescription>
              UMTAS will ask Google to revoke its access and delete the stored
              permissions. Events already in your “UMTAS” calendar stay in
              Google until you delete them there. You can still sign in with
              Google, and you can allow calendar access again when you next
              export.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {revoke.isError && (
            <Alert className={ERROR_ALERT_CLASSES}>
              <AlertCircle size={16} aria-hidden="true" />
              <AlertTitle>We could not remove access</AlertTitle>
              <AlertDescription className="text-[var(--error-text)]">
                Google may be unreachable. Try again in a moment, or remove
                UMTAS in your{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Account permissions
                </a>
                .
              </AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoke.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={revoke.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
            >
              {revoke.isPending ? "Removing…" : "Remove access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
