"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";

export function EmptySchedule() {
  const router = useRouter();

  function handleBuild() {
    router.push("/builder");
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
        <Inbox size={22} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-[var(--text-primary)]">
          No schedule yet
        </p>
        <p className="text-sm text-[var(--text-secondary)] max-w-xs">
          Build your schedule in the builder and generate it to see it here.
        </p>
      </div>
      <Button
        type="button"
        onClick={handleBuild}
        className="mt-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors duration-[var(--duration-fast)]"
      >
        Build a schedule
      </Button>
    </div>
  );
}
