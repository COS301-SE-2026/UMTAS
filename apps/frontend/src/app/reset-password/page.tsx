"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { Button } from "@/components/atoms/baseShadcn/button";
import { UmtasLogo } from "@/components/atoms/auth/UmtasLogo";
import { PasswordInput } from "@/components/atoms/auth/PasswordInput";
import { FormField } from "@/components/molecules/OAuth/FormField";
import { AuthAlert } from "@/components/molecules/OAuth/AuthAlert";
import { AuthPageTemplate } from "@/components/templates/auth/AuthPageTemplate";
import { authClient } from "@/../utilities/auth-client";
import {
  buildAuthLinkHref,
  resolveAuthRedirectTarget,
} from "@/lib/auth-redirect";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = resolveAuthRedirectTarget(searchParams);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid reset link. The token is missing.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setStatus("loading");
    try {
      const { error } = await authClient.resetPassword({ newPassword, token });
      if (error) throw new Error(error.message ?? "Reset failed");
      setStatus("success");
      setMessage(
        `Password reset successfully. Redirecting to ${redirectTarget}…`,
      );
      setTimeout(() => router.push(redirectTarget), 3000);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Try again.",
      );
    }
  }

  return (
    <AuthPageTemplate>
      <Card
        className="w-full max-w-[400px] bg-[var(--bg-surface)] border border-[var(--border)]"
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
        }}
      >
        <CardContent className="p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <UmtasLogo size="md" className="mb-2" />
            <h1
              className="text-[32px] font-semibold leading-tight text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Set new password
            </h1>
            <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
              Must be at least 8 characters
            </p>
          </div>

          {status === "success" ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle
                size={40}
                className="text-[var(--success)]"
                aria-hidden="true"
              />
              <p className="text-[14px] text-[var(--text-secondary)]">
                {message}
              </p>
            </div>
          ) : (
            <>
              {status === "error" && (
                <AuthAlert type="error" message={message} />
              )}
              <form
                onSubmit={handleReset}
                className="flex flex-col gap-4"
                noValidate
                role="form"
                aria-label="Reset password form"
              >
                <FormField id="new-password" label="New password">
                  <PasswordInput
                    id="new-password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={status === "loading"}
                    className="h-9 bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]"
                  />
                </FormField>
                <FormField id="confirm-password" label="Confirm new password">
                  <PasswordInput
                    id="confirm-password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={status === "loading"}
                    className="h-9 bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]"
                  />
                </FormField>
                <Button
                  type="submit"
                  disabled={
                    status === "loading" || !newPassword || !confirmPassword
                  }
                  className="w-full h-9 font-medium text-[14px] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors duration-150"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-2" />
                      Resetting…
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>
              <p className="text-[12px] text-[var(--text-secondary)] text-center">
                <Link
                  href={buildAuthLinkHref("/login", redirectTarget)}
                  className="text-[var(--text-primary)] underline-offset-2 hover:underline transition-colors duration-150"
                >
                  Back to log in
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </AuthPageTemplate>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthPageTemplate>
          <div className="flex items-center justify-center h-40">
            <Loader2
              size={32}
              className="animate-spin text-[var(--text-secondary)]"
            />
          </div>
        </AuthPageTemplate>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
