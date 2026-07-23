"use client";

import { Lock, Loader2 } from "lucide-react";
import { cn } from "@/../utilities/utils";

interface CardLockOverlayProps {
  locked: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export function SolverLock({
  locked,
  loading,
  children,
}: CardLockOverlayProps) {
  return (
    <div className="relative">
      <div
        className={cn(
          "transition-all duration-300",
          locked && "pointer-events-none blur-md",
        )}
      >
        {children}
      </div>

      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-[var(--bg-base)]/40">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
          ) : (
            <Lock className="h-6 w-6 text-[var(--text-disabled)]" />
          )}
        </div>
      )}
    </div>
  );
}
