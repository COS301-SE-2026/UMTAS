import React from "react";
import { Separator } from "@/components/atoms/baseShadcn/separator";

interface AuthDividerProps {
  label?: string;
}

export function AuthDivider({ label = "or" }: AuthDividerProps) {
  return (
    <div className="relative flex items-center" aria-hidden="true">
      <Separator className="flex-1 bg-[var(--border)]" />
      <span className="mx-3 text-[12px] text-[var(--text-secondary)] select-none">
        {label}
      </span>
      <Separator className="flex-1 bg-[var(--border)]" />
    </div>
  );
}
