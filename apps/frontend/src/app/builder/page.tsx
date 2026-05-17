import React from "react";
import { CascadingPanelShell } from "@/components/templates/builder/CascadingPanelShell";

export const metadata = {
  title: "Build Timetable - UMTAS",
};

export default function BuilderPage() {
  return (
    <div className="h-[calc(100dvh-3.5rem)] px-4 py-6 sm:px-6">
      <CascadingPanelShell />
    </div>
  );
}
