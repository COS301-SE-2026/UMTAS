/**
 * /auth-callback page - renders while auth happens
 *
 * BetterAuth handles the actual token exchange at GET /api/auth/callback/google.
 */

"use client";

import React, { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/../utilities/auth-client";
import { UmtasLogo } from "@/components/atoms/auth/UmtasLogo";
import {
  clearAuthRedirectTarget,
  resolveAuthRedirectTarget,
} from "@/lib/auth-redirect";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const redirectTarget = resolveAuthRedirectTarget(searchParams);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const deadline = Date.now() + 10000;

    const pollSession = async () => {
      const sessionResponse = await authClient.getSession();
      const session = sessionResponse?.data;

      if (cancelled) return;

      if (session) {
        clearAuthRedirectTarget();
        window.location.replace(redirectTarget);
        return;
      }

      if (Date.now() >= deadline) {
        clearAuthRedirectTarget();
        window.location.replace("/login");
        return;
      }

      timeoutId = setTimeout(pollSession, 300);
    };

    void pollSession();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [redirectTarget]);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center gap-6 bg-[var(--bg-base)]"
      aria-live="polite"
      aria-busy="true"
    >
      <UmtasLogo size="lg" />

      <div className="flex flex-col items-center gap-3">
        <Loader2
          size={20}
          strokeWidth={1.5}
          className="animate-spin text-[var(--text-secondary)]"
          aria-hidden="true"
        />
        <p className="text-[14px] text-[var(--text-secondary)]">
          Signing you in…
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex flex-col items-center justify-center gap-6 bg-[var(--bg-base)]">
          <UmtasLogo size="lg" />
          <Loader2 size={20} strokeWidth={1.5} className="animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
