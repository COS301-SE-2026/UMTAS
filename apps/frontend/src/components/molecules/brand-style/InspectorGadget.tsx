"use client";

import { Token } from "@/types/BrandStyle";

interface InspectorProps {
  token: Token;
}

export function Inspector({ token }: InspectorProps) {
  return (
    <div className="p-6 flex flex-col rounded-xl border bg-[var(--bg-base)] border-[var(--border)] transition-colors text-left">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)] mb-2">
        Token Inspector
      </span>

      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
        <div
          className="w-16 h-16 rounded-lg border border-[var(--border)] flex-shrink-0"
          style={{ backgroundColor: `var(${token.token})` }}
        />
        <div>
          <p className="text-base font-semibold tracking-tight text-[var(--text-primary)] m-0">
            {token.label}
          </p>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
            {token.token} · hex {token.hex} - {token.hsl} - {token.rgb}
          </p>
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] m-0 leading-relaxed">
        {token.usage}
      </p>
    </div>
  );
}
