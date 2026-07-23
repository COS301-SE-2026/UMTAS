/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { MotionToken } from "@/types/BrandStyle";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Alert, AlertDescription } from "@/components/atoms/baseShadcn/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/baseShadcn/table";
import { Info } from "lucide-react";

const motionTokens: MotionToken[] = [
  {
    token: "--duration-fast",
    value: 150,
    usage: "Micro-interactions, hover states",
  },
  {
    token: "--duration-normal",
    value: 250,
    usage: "Panel opens, tab switches",
  },
  { token: "--duration-slow", value: 400, usage: "Page-level transitions" },
];

export function MotionSection() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeToken, setActiveToken] = useState<string | null>(null);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  function trigger(token: string, durationMs: number) {
    if (reducedMotion) {
      return;
    }

    setActiveToken(null);

    requestAnimationFrame(() =>
      requestAnimationFrame(() => setActiveToken(token)),
    );

    setTimeout(
      () =>
        setActiveToken((activeToken) =>
          activeToken === token ? null : activeToken,
        ),
      durationMs + 50,
    );
  }

  return (
    <div className="w-full text-left space-y-8 py-8 text-[var(--text-secondary)]">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          Motion Tokens
        </h1>
        <p className="leading-relaxed max-w-2xl">
          Three durations, one easing curve. Click any button below to feel the
          difference. Layout-affecting properties are never animated - only
          opacity and transform.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-10">
        {reducedMotion ? (
          <Alert className="bg-[var(--bg-surface)] border-[var(--border)] py-3 px-4 flex items-center gap-2">
            <Info size={14} className="text-[var(--text-secondary)]" />
            <AlertDescription className="text-[13px] text-[var(--text-secondary)] motionToken-0">
              Motion demos suspended - reduced motion preference detected.
            </AlertDescription>
          </Alert>
        ) : (
          motionTokens.map(({ token, value }) => {
            const animating = activeToken === token;
            return (
              <Button
                key={token}
                variant="outline"
                onClick={() => trigger(token, value)}
                className="h-9 px-4 font-medium"
                style={{
                  backgroundColor: animating
                    ? "var(--bg-elevated)"
                    : "var(--bg-surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                  transform: animating
                    ? "translateY(-2px) scale(0.98)"
                    : "translateY(0) scale(1)",
                  transition: `transform ${value}ms var(--easing-default), background-color ${value}ms var(--easing-default)`,
                }}
              >
                {token.replace("--duration-", "")} - {value}ms
              </Button>
            );
          })
        )}
      </div>

      <div className="w-fit rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--bg-base)]">
        <Table>
          <TableHeader className="bg-[var(--bg-surface)] hover:bg-[var(--bg-surface)]">
            <TableRow className="border-b border-[var(--border)] hover:bg-transparent">
              <TableHead className="w-[200px] text-[11px] uppercase tracking-[0.04em] text-[var(--text-secondary)] font-medium">
                Token
              </TableHead>
              <TableHead className="w-[100px] text-[11px] uppercase tracking-[0.04em] text-[var(--text-secondary)] font-medium">
                Value
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-[0.04em] text-[var(--text-secondary)] font-medium">
                Usage
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {motionTokens.map((motionToken) => (
              <TableRow
                key={motionToken.token}
                className="border-b border-[var(--border)] hover:bg-transparent"
              >
                <TableCell className="font-mono text-[13px] font-medium text-[var(--text-primary)]">
                  {motionToken.token}
                </TableCell>
                <TableCell className="font-mono text-[13px] text-[var(--text-secondary)]">
                  {motionToken.value}ms
                </TableCell>
                <TableCell className="text-[13px] text-[var(--text-secondary)]">
                  {motionToken.usage}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-[13px] text-[var(--text-secondary)] mt-5 leading-[1.6]">
        Easing:{" "}
        <code className="font-mono text-[12px] px-1.5 py-0.5 bg-[var(--bg-surface)] rounded-md border border-[var(--border)] text-[var(--text-primary)]">
          cubic-bezier(0.4, 0, 0.2, 1)
        </code>{" "}
        for all transitions. No linear, no ease-in, no ease-out.
      </p>
    </div>
  );
}
