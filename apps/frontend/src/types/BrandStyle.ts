import type { ComponentType } from "react";
import type { LucideProps, LucideIcon } from "lucide-react";

export type ThemeMode = "light" | "dark";

//for nav section
export interface Link {
  id: string;
  label: string;
  Icon: LucideIcon;
}

//general attributes for the different sections
export interface Token {
  token: string;
  hex: string;
  rgb: string;
  hsl: string;
  label: string;
  usage: string;
}

//colour specific
export interface Palette {
  mode: ThemeMode;
  tokens: Token[];
}

export interface StatusColour {
  label: string;
  light: { background: string; text: string };
  dark: { background: string; text: string };
}

//type specific
export interface TypeScaleItem {
  role: string;
  size: number;
  weight: number;
  lh: number;
  ls: string;
  sample: string;
  micro?: boolean;
}

//spacing specific
export interface SpacingToken {
  token: string;
  px: number;
  usage: string;
}

//border
export interface RadiusElement {
  name: string;
  value: string;
  px: string;
  radiusPx: number;
}

export interface ShadowItem {
  level: string;
  shadow: string;
  usage: string;
}

//motion specific
export interface MotionToken {
  token: string;
  value: number;
  usage: string;
}

//icons
export interface IconDefinition {
  name: string;
  Icon: ComponentType<LucideProps>;
}

export interface NavigationSection {
  id: string;
  label: string;
  Icon: ComponentType<LucideProps>;
}

export interface VoiceToneItem {
  instance: string;
  tone: string;
  example: string;
}

export interface AccessibilityRule {
  Icon: ComponentType<LucideProps>;
  label: string;
  sub: string;
  body: string;
}

export interface BreakpointItem {
  bp: string;
  width: string;
  cols: string;
  behaviour: string;
}

export interface Session {
  day: number;
  startSlot: number;
  span: number;
  code: string;
  kind: string;
}
