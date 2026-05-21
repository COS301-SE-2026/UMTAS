import React from "react";
import { WizardShell } from "@/components/templates/builder/WizardShell";

export const metadata = { title: "Builder" };

export default function BuilderPage() {
  return (
    <div className="h-[calc(100vh-var(--nav-height))] bg-[var(--bg-base)]">
      <WizardShell />
    </div>
  );
}
