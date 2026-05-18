/**
 * /auth-callback page - renders while auth happens
 *
 * BetterAuth handles the actual token exchange at GET /api/auth/callback/google.
 *
 * This is NOT a BetterAuth route. It is the frontend loading screen only.
 * Route the user here by setting callbackURL="/auth-callback" in the signIn
 * calls if a distinct loading screen is preferred over direct /dashboard
 * redirect. Currently signIn.social points directly at /dashboard which is
 * the simpler approach.
 */

"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@/../utilities/auth-client";
import { UmtasLogo } from "@/components/atoms/auth/UmtasLogo";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/dashboard");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/login");
    }, 10000);
    return () => clearTimeout(timeout);
  }, [router]);

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
