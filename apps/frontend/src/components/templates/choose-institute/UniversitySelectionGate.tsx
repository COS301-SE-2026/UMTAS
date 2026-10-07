"use client";

import { usePathname } from "next/navigation";
import { useUniversityState } from "@/hooks/useUniversityState";
import { ChooseInstituteTemplate } from "./chooseInstituteTemplate";

const GATE_EXEMPT_PATHS = ["/dashboard", "/privacy", "/terms", "/account"];

export function UniversitySelectionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { requiresSelection } = useUniversityState();
  const pathname = usePathname();

  if (requiresSelection && !GATE_EXEMPT_PATHS.includes(pathname ?? "")) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <ChooseInstituteTemplate />
      </main>
    );
  }

  return children;
}
