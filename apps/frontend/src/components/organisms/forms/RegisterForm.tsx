/**
 * Auth integration:
 *   Email/password: calls signUp.email({ name, email, password, callbackURL: "/dashboard" })
 *   Google OAuth:   calls signIn.social({ provider: "google", callbackURL: "/dashboard" })
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { UmtasLogo } from "@/components/atoms/auth/UmtasLogo";
import { PasswordInput } from "@/components/atoms/auth/PasswordInput";
import { FormField } from "@/components/molecules/OAuth/FormField";
import { GoogleSignInButton } from "@/components/molecules/OAuth/GoogleSignInButton";
import { AuthDivider } from "@/components/molecules/OAuth/AuthDivider";
import { AuthAlert } from "@/components/molecules/OAuth/AuthAlert";
import { PasswordStrengthBadge } from "@/components/molecules/OAuth/PasswordStrengthBadge";
import { signUp, signIn } from "@/../utilities/auth-client";
import {
  buildAuthCallbackUrl,
  buildAuthLinkHref,
  buildRedirectUrl,
  resolveAuthRedirectTarget,
  storeAuthRedirectTarget,
} from "@/lib/auth-redirect";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validateFields(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!name.trim()) errors.name = "Full name is required.";
  if (!email.trim()) errors.email = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 8)
    errors.password = "Password must be at least 8 characters.";
  if (!confirmPassword)
    errors.confirmPassword = "Please confirm your password.";
  else if (password !== confirmPassword)
    errors.confirmPassword = "Passwords do not match.";
  return errors;
}

function mapAuthError(message: string): string {
  if (
    message.toLowerCase().includes("already") ||
    message.toLowerCase().includes("exists")
  ) {
    return "An account with that email address already exists. Log in or reset your password.";
  }
  if (message.toLowerCase().includes("email")) {
    return "That email address is not valid. Use your university email (e.g. student@up.ac.za).";
  }
  return "Account creation failed. Check your details and try again.";
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const redirectTarget = resolveAuthRedirectTarget(searchParams);

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    const errors = validateFields(name, email, password, confirmPassword);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsEmailLoading(true);
    storeAuthRedirectTarget(redirectTarget);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
        callbackURL: buildRedirectUrl(redirectTarget),
      });

      if (result?.error) {
        setGlobalError(mapAuthError(result.error.message ?? "Unknown error"));
      } else {
        router.push(
          redirectTarget === "/dashboard"
            ? "/verify-pending"
            : `/verify-pending?next=${encodeURIComponent(redirectTarget)}`,
        );
      }
    } catch {
      setGlobalError(
        "Account creation failed. Check your connection and try again.",
      );
    } finally {
      setIsEmailLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setGlobalError(null);
    setIsGoogleLoading(true);
    storeAuthRedirectTarget(redirectTarget);

    try {
      await signIn.social({
        provider: "google",
        callbackURL: buildAuthCallbackUrl(redirectTarget),
      });
    } catch {
      setGlobalError(
        "Google sign-up failed. Try again or use email and password.",
      );
      setIsGoogleLoading(false);
    }
  }

  const anyLoading = isEmailLoading || isGoogleLoading;

  return (
    <Card
      className="w-full max-w-[440px] bg-[var(--bg-surface)] border border-[var(--border)]"
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
            Create your account
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
            Set up your UMTAS account to start building your timetable
          </p>
        </div>

        {globalError && <AuthAlert type="error" message={globalError} />}

        <form
          onSubmit={handleEmailSignUp}
          className="flex flex-col gap-4"
          noValidate
          aria-label="Create account form"
        >
          <FormField
            id="register-name"
            label="Full Name"
            error={fieldErrors.name}
          >
            <Input
              type="text"
              placeholder="e.g. Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              disabled={anyLoading}
              className="h-9 bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]"
            />
          </FormField>

          <FormField
            id="register-email"
            label="Email"
            error={fieldErrors.email}
          >
            <Input
              type="email"
              placeholder="e.g. student@up.ac.za"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={anyLoading}
              className="h-9 bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]"
            />
          </FormField>

          <div className="flex flex-col gap-2">
            <FormField
              id="register-password"
              label="Password"
              error={fieldErrors.password}
            >
              <PasswordInput
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={anyLoading}
                className="h-9 bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]"
              />
            </FormField>
            <PasswordStrengthBadge password={password} />
          </div>

          <FormField
            id="register-confirm-password"
            label="Confirm Password"
            error={fieldErrors.confirmPassword}
          >
            <PasswordInput
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={anyLoading}
              className="h-9 bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]"
            />
          </FormField>

          <Button
            type="submit"
            disabled={anyLoading}
            className="w-full h-9 font-medium text-[14px] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors duration-150"
          >
            {isEmailLoading ? (
              <>
                <Loader2
                  size={14}
                  className="animate-spin mr-2"
                  aria-hidden="true"
                />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <AuthDivider />

        <GoogleSignInButton
          onClick={handleGoogleSignUp}
          label="Sign up with Google"
          isLoading={isGoogleLoading}
          disabled={anyLoading}
        />

        <p className="text-[12px] text-[var(--text-secondary)] text-center">
          Already have an account?{" "}
          <Link
            href={buildAuthLinkHref("/login", redirectTarget)}
            className="text-[var(--text-primary)] underline-offset-2 hover:underline transition-colors duration-150"
          >
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
