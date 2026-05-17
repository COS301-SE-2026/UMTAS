import React from "react";
import { Calendar } from "lucide-react";

interface UmtasLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { icon: 16, text: "text-base" },
  md: { icon: 20, text: "text-xl" },
  lg: { icon: 24, text: "text-2xl" },
};

export function UmtasLogo({ size = "md", className = "" }: UmtasLogoProps) {
  const { icon, text } = sizeMap[size];

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="img"
      aria-label="UMTAS logo"
    >
      <Calendar
        size={icon}
        strokeWidth={1.5}
        className="text-[var(--text-primary)]"
        aria-hidden="true"
      />
      <span
        className={`${text} font-semibold tracking-tight text-[var(--text-primary)]`}
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        UMTAS
      </span>
    </div>
  );
}
