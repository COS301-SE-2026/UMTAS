import React from "react";
import { Badge } from "@/components/atoms/baseShadcn/badge";

interface PasswordStrengthBadgeProps {
  password: string;
}

type Strength = "empty" | "weak" | "fair" | "strong";

function calcStrength(password: string): Strength {
  if (!password) return "empty";
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return "weak";
  if (score <= 3) return "fair";
  return "strong";
}

const styleMap: Record<Strength, { label: string; className: string }> = {
  empty: { label: "", className: "" },
  weak: {
    label: "Weak",
    className:
      "bg-[#78350f] text-[#fcd34d] dark:bg-[#78350f] dark:text-[#fcd34d] border-transparent",
  },
  fair: {
    label: "Fair",
    className:
      "bg-[#78350f]/60 text-[#fcd34d] dark:bg-[#78350f]/60 dark:text-[#fcd34d] border-transparent",
  },
  strong: {
    label: "Strong",
    className:
      "bg-[#14532d] text-[#86efac] dark:bg-[#14532d] dark:text-[#86efac] border-transparent",
  },
};

export function PasswordStrengthBadge({
  password,
}: PasswordStrengthBadgeProps) {
  const strength = calcStrength(password);
  if (strength === "empty") return null;

  const { label, className } = styleMap[strength];

  return (
    <Badge
      aria-live="polite"
      aria-label={`Password strength: ${label}`}
      className={`text-[11px] font-medium tracking-wider uppercase px-2 py-0.5 ${className}`}
    >
      {label}
    </Badge>
  );
}
