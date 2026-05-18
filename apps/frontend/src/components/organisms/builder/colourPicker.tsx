import React from "react";

export interface ColourOption {
  value: string;
  label: string;
}

export const Module_Colours: ColourOption[] = [
  { value: "#4A90F8", label: "Blue" },
  { value: "#22C55E", label: "Green" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#F56363", label: "Red" },
  { value: "#A78BFA", label: "Purple" },
  { value: "#FB923C", label: "Orange" },
  { value: "#38BDF8", label: "Sky" },
  { value: "#F472B6", label: "Pink" },
];

interface ColourPickerProps {
  value: string;
  onChange: (colour: string) => void;
}

export function ColourPicker({ value, onChange }: ColourPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {Module_Colours.map((colour) => {
        const isSelected = value === colour.value;
        return (
          <button
            key={colour.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={colour.label}
            onClick={() => onChange(colour.value)}
            className={[
              "relative h-7 w-7 rounded-full transition-all duration-150 focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-[var(--text-primary)] focus-visible:ring-offset-2",
              "focus-visible:ring-offset-[var(--bg-surface)]",
              isSelected
                ? "ring-2 ring-offset-2 ring-[var(--text-primary)] ring-offset-[var(--bg-surface)] scale-110"
                : "hover:scale-110 opacity-80 hover:opacity-100",
            ].join(" ")}
            style={{ backgroundColor: colour.value }}
          >
            {isSelected && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
