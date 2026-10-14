"use client";

import { useState } from "react";
import { AlertCircle, TriangleAlert } from "lucide-react";
import { signOut, useSession } from "@/../utilities/auth-client";
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
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import {
  FreshSessionRequiredError,
  useDeleteAccount,
} from "@/app/account/queries/useDeleteAccount";

const ERROR_ALERT_CLASSES =
  "border-[var(--error-text)] bg-[var(--error-bg)] text-[var(--error-text)]";

export function DeleteAccountPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [typedEmail, setTypedEmail] = useState("");
  const { data: session } = useSession();
  const deleteAccount = useDeleteAccount();

  const accountEmail = session?.user?.email;
  const canConfirm =
    Boolean(accountEmail) &&
    typedEmail.trim().toLowerCase() === accountEmail?.trim().toLowerCase() &&
    !deleteAccount.isPending;
  const needsFreshSession =
    deleteAccount.error instanceof FreshSessionRequiredError;

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      setTypedEmail("");
      deleteAccount.reset();
    }
  }

  async function handleSignInAgain() {
    await signOut();
    window.location.assign("/login?next=/account");
  }

  return (
    <Card className="border border-[var(--error-text)] bg-[var(--bg-surface)] shadow-[var(--shadow-low)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[18px] font-semibold leading-[1.4] text-[var(--error-text)]">
          <TriangleAlert size={20} aria-hidden="true" />
          Delete account
        </CardTitle>
        <CardDescription className="text-[14px] leading-[1.6] text-[var(--text-primary)]">
          Deleting your account is permanent.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="list-disc space-y-1 pl-5 text-[14px] leading-[1.6] text-[var(--text-primary)]">
          <li>
            Your profile, university roles, enrolments, timetables, preferences
            and attendance records are deleted.
          </li>
          <li>
            University module PDFs and shared module groupings are kept so we
            can recompute module groupings.
          </li>
          <li>
            UMTAS asks Google to revoke its access to your Google Calendar.
            Events already in your Google Calendar stay there until you delete
            them.
          </li>
          <li>You are signed out on every device.</li>
        </ul>
        <Button
          type="button"
          variant="destructive"
          onClick={() => handleOpenChange(true)}
        >
          Delete account
        </Button>
      </CardContent>

      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. To confirm, type your email address
              {accountEmail ? ` (${accountEmail})` : ""} below.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-account-email">Email address</Label>
            <Input
              id="delete-account-email"
              type="email"
              autoComplete="off"
              value={typedEmail}
              onChange={(event) => setTypedEmail(event.target.value)}
            />
          </div>

          {needsFreshSession && (
            <Alert className={ERROR_ALERT_CLASSES}>
              <AlertCircle size={16} aria-hidden="true" />
              <AlertTitle>Please sign in again first</AlertTitle>
              <AlertDescription className="text-[var(--error-text)]">
                For your security, deleting an account needs a recent sign-in.
                Sign in again, then return here to finish.
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleSignInAgain()}
                  >
                    Sign in again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {deleteAccount.isError && !needsFreshSession && (
            <Alert className={ERROR_ALERT_CLASSES}>
              <AlertCircle size={16} aria-hidden="true" />
              <AlertTitle>We could not delete your account</AlertTitle>
              <AlertDescription className="text-[var(--error-text)]">
                {deleteAccount.error.message} Try again, or contact us if it
                keeps happening.
              </AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAccount.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!canConfirm}
              onClick={(event) => {
                event.preventDefault();
                deleteAccount.mutate();
              }}
            >
              {deleteAccount.isPending ? "Deleting…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
