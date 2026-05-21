"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { Button } from "@/components/atoms/baseShadcn/button";
import { UmtasLogo } from "@/components/atoms/auth/UmtasLogo";
import { AuthAlert } from "@/components/molecules/OAuth/AuthAlert";
import { AuthPageTemplate } from "@/components/templates/auth/AuthPageTemplate";
import { authClient, useSession } from "@/../utilities/auth-client";

export default function VerifyPendingPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "error">(
    "idle",
  );

  async function handleResend() {
    setResendStatus("idle");
    setIsLoading(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: session?.user?.email ?? "",
        callbackURL: "/dashboard",
      });
      setResendStatus(error ? "error" : "sent");
    } catch {
      setResendStatus("error");
    } finally {
      setIsLoading(false);
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
        <CardContent className="p-8 flex flex-col gap-6 items-center text-center">
          <UmtasLogo size="md" />
          <div className="flex flex-col items-center gap-2">
            <Mail
              size={40}
              className="text-[var(--text-secondary)]"
              aria-hidden="true"
            />
            <h1
              className="text-[24px] font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Check your inbox
            </h1>
            <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
              We sent a verification link to{" "}
              <span className="text-[var(--text-primary)] font-medium">
                {session?.user?.email ?? "your email"}
              </span>
              . Click the link to activate your account.
            </p>
          </div>

          {resendStatus === "sent" && (
            <AuthAlert
              type="success"
              message="Email sent - check your inbox."
            />
          )}
          {resendStatus === "error" && (
            <AuthAlert
              type="error"
              message="Could not resend. Try again in a moment."
            />
          )}

          <Button
            onClick={handleResend}
            disabled={isLoading}
            variant="outline"
            className="w-full h-9 font-medium text-[14px] border-[var(--border)] text-[var(--text-primary)]"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin mr-2" />
                Sending…
              </>
            ) : (
              "Resend verification email"
            )}
          </Button>

          <p className="text-[12px] text-[var(--text-secondary)]">
            Wrong email?{" "}
            <Link
              href="/register"
              className="text-[var(--text-primary)] underline-offset-2 hover:underline transition-colors duration-150"
            >
              Register again
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthPageTemplate>
  );
}
