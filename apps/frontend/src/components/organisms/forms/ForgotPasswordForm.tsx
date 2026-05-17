"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { UmtasLogo } from "@/components/atoms/auth/UmtasLogo";
import { FormField } from "@/components/molecules/OAuth/FormField";
import { AuthAlert } from "@/components/molecules/OAuth/AuthAlert";
import { authClient } from "@/../utilities/auth-client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await authClient.forgetPassword({
        email,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || ""}/reset-password`,
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
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
            Reset your password
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        {submitted ? (
          <div className="flex flex-col gap-4">
            <AuthAlert
              type="success"
              message="Check your inbox — if that address is registered, a reset link is on its way."
            />
            <p className="text-[12px] text-[var(--text-secondary)] text-center">
              <Link
                href="/login"
                className="text-[var(--text-primary)] underline-offset-2 hover:underline transition-colors duration-150"
              >
                Back to log in
              </Link>
            </p>
          </div>
        ) : (
          <>
            {error && <AuthAlert type="error" message={error} />}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
              noValidate
              aria-label="Forgot password form"
            >
              <FormField id="forgot-email" label="Email">
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="e.g. student@up.ac.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  className="h-9 bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]"
                />
              </FormField>
              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full h-9 font-medium text-[14px] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors duration-150"
              >
                {isLoading ? (
                  <>
                    <Loader2
                      size={14}
                      className="animate-spin mr-2"
                      aria-hidden="true"
                    />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
            <p className="text-[12px] text-[var(--text-secondary)] text-center">
              <Link
                href="/login"
                className="text-[var(--text-primary)] underline-offset-2 hover:underline transition-colors duration-150"
              >
                Back to log in
              </Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
