import { LightModeShell } from "./LightModeShell";
import { DarkModeShell } from "./DarkModeShell";
import { useState } from "react";

interface ColourPaletteProps {
  darkColours: string[];
  lightColours: string[];
  onViewModeChange?: (mode: "Light Mode" | "Dark Mode") => void;
}

export default function ColourPalette({
  darkColours,
  lightColours,
}: ColourPaletteProps) {
  const [viewMode, setViewMode] = useState<"Light Mode" | "Dark Mode">(
    "Light Mode",
  );

  function renderView() {
    //if (viewMode === "Light Mode") {
    //return (
    //<LightModeShell/>
    //);
    //}

    return (
      <>
        <LightModeShell />
        <DarkModeShell />
      </>
    );
  }
  return (
    <div className="flex flex-row flex-wrap items-start">{renderView()}</div>
  );
}
