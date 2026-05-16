/**
 * Auth integration:
 *   Email/password: calls signIn.email({ email, password, callbackURL: "/dashboard" })
 *   Google OAuth:   calls signIn.social({ provider: "google", callbackURL: "/dashboard" })
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { signIn } from "@/../utilities/auth-client";

function mapAuthError(message: string): string {
  if (
    message.toLowerCase().includes("invalid") ||
    message.toLowerCase().includes("credentials")
  ) {
    return "Incorrect email or password. Check your details and try again.";
  }
  if (
    message.toLowerCase().includes("not found") ||
    message.toLowerCase().includes("no user")
  ) {
    return "No account found with that email address. Register to create one.";
  }
  if (message.toLowerCase().includes("locked")) {
    return "Your account has been locked after too many failed attempts. Contact support.";
  }
  if (
    message.toLowerCase().includes("verify") ||
    message.toLowerCase().includes("verification")
  ) {
    return "Your email address has not been verified. Check your inbox for the verification link.";
  }
  return "Sign-in failed. Check your connection and try again.";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsEmailLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (result?.error) {
        setError(mapAuthError(result.error.message ?? "Unknown error"));
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Sign-in failed. Check your connection and try again.");
    } finally {
      setIsEmailLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setIsGoogleLoading(true);

    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch {
      setError("Google sign-in failed. Try again or use email and password.");
      setIsGoogleLoading(false);
    }
  }

  const anyLoading = isEmailLoading || isGoogleLoading;

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
            Log in to UMTAS
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
            Enter your details to access your timetable
          </p>
        </div>

        {error && <AuthAlert type="error" message={error} />}

        <form
          onSubmit={handleEmailSignIn}
          className="flex flex-col gap-4"
          noValidate
          aria-label="Email and password sign-in form"
        >
          <FormField id="login-email" label="Email">
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

          <FormField id="login-password" label="Password">
            <PasswordInput
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={anyLoading}
              className="h-9 bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]"
            />
          </FormField>

          <Button
            type="submit"
            disabled={anyLoading || !email || !password}
            className="w-full h-9 font-medium text-[14px] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors duration-150"
          >
            {isEmailLoading ? (
              <>
                <Loader2
                  size={14}
                  className="animate-spin mr-2"
                  aria-hidden="true"
                />
                Signing in…
              </>
            ) : (
              "Log in"
            )}
          </Button>
        </form>

        <AuthDivider />

        <GoogleSignInButton
          onClick={handleGoogleSignIn}
          label="Continue with Google"
          isLoading={isGoogleLoading}
          disabled={anyLoading}
        />

        <p className="text-[12px] text-[var(--text-secondary)] text-center">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-[var(--text-primary)] underline-offset-2 hover:underline transition-colors duration-150"
          >
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
