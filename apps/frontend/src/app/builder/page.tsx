import React, { Suspense } from "react";
import { WizardShell } from "@/components/templates/builder/WizardShell";

export const metadata = { title: "Builder" };

export default function BuilderPage() {
  return (
    <div className="h-[calc(100vh-var(--nav-height))] bg-[var(--bg-base)]">
      <Suspense
        fallback={
          <div className="p-3 text-center">
            Builder is loading, please be patient
          </div>
        }
      >
        <WizardShell />
      </Suspense>
    </div>
  );
}
