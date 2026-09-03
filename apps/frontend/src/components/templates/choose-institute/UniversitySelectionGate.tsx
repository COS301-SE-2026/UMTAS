"use client";

import { useUniversityState } from "@/hooks/useUniversityState";
import { ChooseInstituteTemplate } from "./chooseInstituteTemplate";

export function UniversitySelectionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { requiresSelection } = useUniversityState();

  if (requiresSelection) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <ChooseInstituteTemplate />
      </main>
    );
  }

  return children;
}
