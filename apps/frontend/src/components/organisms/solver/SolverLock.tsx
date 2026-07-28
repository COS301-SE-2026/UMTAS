"use client";

import { Lock, Loader2 } from "lucide-react";

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
  if (locked) {
    return (
      <div className="flex h-full min-h-125 w-full flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm transition-all duration-300">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--text-secondary)]" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Loading...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center opacity-70">
            <div className="rounded-full bg-[var(--bg-elevated)] p-4">
              <Lock className="h-6 w-6 text-[var(--text-disabled)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Complete the previous step to unlock
            </p>
          </div>
        )}
      </div>
    );
  }
  return <>{children}</>;
}
