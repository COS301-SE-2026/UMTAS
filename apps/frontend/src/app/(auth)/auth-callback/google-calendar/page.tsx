"use client";

import { Suspense, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { UmtasLogo } from "@/components/atoms/auth/UmtasLogo";
import { finishCalendarConsent } from "@/lib/auth/google-calendar";
import { useSearchParams } from "next/navigation";

function GoogleCalendarCallbackContent() {
  const searchParams = useSearchParams();
  const completed = useRef(false);

  useEffect(() => {
    if (completed.current) return;
    completed.current = true;
    finishCalendarConsent(searchParams.get("status"));
  }, [searchParams]);

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
          Finishing Google Calendar setup…
        </p>
      </div>
    </div>
  );
}

export default function GoogleCalendarCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-base)]">
          <UmtasLogo size="lg" />
          <Loader2 size={20} className="animate-spin" />
        </div>
      }
    >
      <GoogleCalendarCallbackContent />
    </Suspense>
  );
}
