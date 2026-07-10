import { Token } from "@/types/BrandStyle";

export const LightPalette: Token[] = [
  {
    token: "--bg-base",
    hex: "#ffffff",
    label: "White Base",
    usage: "Page background",
  },
  {
    token: "--bg-surface",
    hex: "#f4f4f5",
    label: "Off-White Surface",
    usage: "Cards, panels, modals",
  },
  {
    token: "--bg-elevated",
    hex: "#e4e4e7",
    label: "Light Elevated",
    usage: "Hover states, dividers",
  },
  {
    token: "--text-primary",
    hex: "#09090b",
    label: "Near-Black Primary",
    usage: "All primary body and heading text",
  },
  {
    token: "--text-secondary",
    hex: "#52525b",
    label: "Dark Grey Secondary",
    usage: "Muted labels, captions, metadata",
  },
  {
    token: "--text-disabled",
    hex: "#a1a1aa",
    label: "Disabled",
    usage: "Placeholder text, disabled states",
  },
  {
    token: "--border",
    hex: "#e4e4e7",
    label: "Subtle Border",
    usage: "1px card and input borders",
  },
  {
    token: "--ring",
    hex: "#18181b",
    label: "Focus Ring",
    usage: "Keyboard focus indicators",
  },
  {
    token: "--shadow",
    hex: "rgba(0,0,0,0.08)",
    label: "Card Shadow",
    usage: "Subtle elevation on cards",
  },
];

export const DarkPalette: Token[] = [
  {
    token: "--bg-base",
    hex: "#18181b",
    label: "Charcoal Base",
    usage: "Page background",
  },
  {
    token: "--bg-surface",
    hex: "#27272a",
    label: "Charcoal Surface",
    usage: "Cards, panels, modals",
  },
  {
    token: "--bg-elevated",
    hex: "#3f3f46",
    label: "Charcoal Elevated",
    usage: "Hover states, dividers",
  },
  {
    token: "--text-primary",
    hex: "#e8e8e8",
    label: "Off-White Primary",
    usage: "All primary body and heading text",
  },
  {
    token: "--text-secondary",
    hex: "#9a9a9a",
    label: "Off-White Secondary",
    usage: "Muted labels, captions, metadata",
  },
  {
    token: "--text-disabled",
    hex: "#555555",
    label: "Disabled",
    usage: "Placeholder text, disabled states",
  },
  {
    token: "--border",
    hex: "#3f3f46",
    label: "Subtle Border",
    usage: "1px card and input borders",
  },
  {
    token: "--ring",
    hex: "#e8e8e8",
    label: "Focus Ring",
    usage: "Keyboard focus indicators",
  },
  {
    token: "--shadow",
    hex: "rgba(0,0,0,0.35)",
    label: "Card Shadow",
    usage: "Subtle elevation on cards",
  },
];

export const StatusColoursList = [
  { label: "Error", prefix: "error", lightHex: "#fee2e2", darkHex: "#7f1d1d" },
  {
    label: "Success",
    prefix: "success",
    lightHex: "#dcfce7",
    darkHex: "#14532d",
  },
  {
    label: "Warning",
    prefix: "warning",
    lightHex: "#fef3c7",
    darkHex: "#78350f",
  },
];
