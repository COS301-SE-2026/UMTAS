"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { Button } from "@/components/atoms/baseShadcn/button";
import { UmtasLogo } from "@/components/atoms/auth/UmtasLogo";
import { AuthPageTemplate } from "@/components/templates/auth/AuthPageTemplate";
import { authClient } from "@/../utilities/auth-client";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [message, setMessage] = useState(
    token ? "" : "Invalid verification link. No token found.",
  );

  useEffect(() => {
    if (!token) return;

    authClient
      .verifyEmail({ query: { token } })
      .then(({ error }) => {
        if (error) throw new Error(error.message ?? "Verification failed");
        setStatus("success");
        setMessage("Email verified! Redirecting to login…");
        setTimeout(() => router.push("/login"), 3000);
      })
      .catch((err: unknown) => {
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "An unexpected error occurred.",
        );
      });
  }, [token, router]);

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

          {status === "loading" && (
            <div className="flex flex-col items-center gap-3">
              <Loader2
                size={40}
                className="animate-spin text-[var(--text-secondary)]"
                aria-hidden="true"
              />
              <p className="text-[14px] text-[var(--text-secondary)]">
                Verifying your email…
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle
                size={40}
                className="text-[var(--success)]"
                aria-hidden="true"
              />
              <h1
                className="text-[20px] font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Email verified
              </h1>
              <p className="text-[14px] text-[var(--text-secondary)]">
                {message}
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <XCircle
                size={40}
                className="text-[var(--destructive)]"
                aria-hidden="true"
              />
              <h1
                className="text-[20px] font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Verification failed
              </h1>
              <p className="text-[14px] text-[var(--text-secondary)]">
                {message}
              </p>
              <Button
                asChild
                className="w-full h-9 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
              >
                <Link href="/login">Go to login</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthPageTemplate>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
