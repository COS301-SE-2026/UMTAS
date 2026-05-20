"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  BookOpen,
  User,
  Settings,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Info,
  ArrowUpRight,
  Copy,
  Sparkle,
  Layers,
  Type as TypeIcon,
  Ruler,
  CornerDownRight,
  Aperture,
  Zap,
  Component,
  Box,
  ShieldCheck,
  MessageSquare,
  Eye,
  Keyboard,
  Globe,
  SquareCode,
  Moon,
  Sun,
} from "lucide-react";

// shadcn components
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/atoms/baseShadcn/alert";
import { Avatar, AvatarFallback } from "@/components/atoms/baseShadcn/avatar";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { Separator } from "@/components/atoms/baseShadcn/separator";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { Slider } from "@/components/atoms/baseShadcn/slider";
import { Switch } from "@/components/atoms/baseShadcn/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/baseShadcn/tabs";
import { Textarea } from "@/components/atoms/baseShadcn/textarea";
import { Toggle } from "@/components/atoms/baseShadcn/toggle";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/atoms/baseShadcn/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/baseShadcn/tooltip";

type Theme = "light" | "dark";

type Token = {
  token: string;
  hex: string;
  label: string;
  usage: string;
};

type Palette = {
  mode: Theme;
  tokens: Token[];
};

const LightPalette: Token[] = [
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
    usage: "Body and heading text",
  },
  {
    token: "--text-secondary",
    hex: "#52525b",
    label: "Dark Grey Secondary",
    usage: "Muted labels, captions",
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
];

const DarkPalette: Token[] = [
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
    usage: "Body and heading text",
  },
  {
    token: "--text-secondary",
    hex: "#9a9a9a",
    label: "Off-White Secondary",
    usage: "Muted labels, captions",
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
];

const StatusColours = [
  {
    label: "Error",
    light: { bg: "#fee2e2", text: "#991b1b" },
    dark: { bg: "#7f1d1d", text: "#fca5a5" },
  },
  {
    label: "Success",
    light: { bg: "#dcfce7", text: "#15803d" },
    dark: { bg: "#14532d", text: "#86efac" },
  },
  {
    label: "Warning",
    light: { bg: "#fef3c7", text: "#b45309" },
    dark: { bg: "#c2410c", text: "#fcd34d" },
  },
];

const TypeScale = [
  {
    role: "Display",
    size: 32,
    weight: 600,
    lh: 1.2,
    ls: "0em",
    sample: "Trust through clarity",
  },
  {
    role: "Heading 1",
    size: 24,
    weight: 600,
    lh: 1.3,
    ls: "0em",
    sample: "Section heading",
  },
  {
    role: "Heading 2",
    size: 18,
    weight: 600,
    lh: 1.4,
    ls: "0em",
    sample: "Card or sub-section",
  },
  {
    role: "Heading 3",
    size: 15,
    weight: 500,
    lh: 1.4,
    ls: "0em",
    sample: "Small heading",
  },
  {
    role: "Body",
    size: 14,
    weight: 400,
    lh: 1.6,
    ls: "0em",
    sample:
      "Default body text used for paragraphs and running copy throughout the interface.",
  },
  {
    role: "Small",
    size: 12,
    weight: 400,
    lh: 1.5,
    ls: "0em",
    sample: "Captions, metadata and table cell content.",
  },
  {
    role: "Micro",
    size: 11,
    weight: 500,
    lh: 1.4,
    ls: "0.04em",
    sample: "Table headers · Tag labels",
    micro: true,
  },
];

const SpacingTokens = [
  { token: "space-1", px: 4, usage: "Micro gaps, icon-to-label" },
  { token: "space-2", px: 8, usage: "Badge padding, small gaps" },
  { token: "space-3", px: 12, usage: "Input internal padding" },
  { token: "space-4", px: 16, usage: "Card padding, row heights" },
  { token: "space-6", px: 24, usage: "Card-to-card gap" },
  { token: "space-8", px: 32, usage: "Section spacing" },
  { token: "space-12", px: 48, usage: "Major section dividers" },
];

const RadiusElements = [
  { name: "Cards", value: "0.5rem", px: "8px", radiusPx: 8 },
  { name: "Buttons", value: "0.5rem", px: "8px", radiusPx: 8 },
  { name: "Inputs", value: "0.5rem", px: "8px", radiusPx: 8 },
  { name: "Modals", value: "0.75rem", px: "12px", radiusPx: 12 },
  { name: "Badges", value: "9999px", px: "pill", radiusPx: 9999 },
  { name: "Tooltips", value: "0.375rem", px: "6px", radiusPx: 6 },
  { name: "Grid cells", value: "0.25rem", px: "4px", radiusPx: 4 },
];

const Shadows = [
  { level: "None", shadow: "none", usage: "Flat surfaces" },
  {
    level: "Low",
    shadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
    usage: "Default cards",
  },
  {
    level: "Medium",
    shadow: "0 4px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.10)",
    usage: "Modals, dropdowns",
  },
  {
    level: "High",
    shadow: "0 10px 15px rgba(0,0,0,0.20), 0 4px 6px rgba(0,0,0,0.12)",
    usage: "Floating overlays",
  },
];

const MotionTokens = [
  {
    token: "--duration-fast",
    value: 150,
    usage: "Micro-interactions, hover states",
  },
  {
    token: "--duration-normal",
    value: 250,
    usage: "Panel opens, tab switches",
  },
  { token: "--duration-slow", value: 400, usage: "Page-level transitions" },
];

const IconDefinitions = [
  { name: "CalendarDays", Icon: CalendarDays },
  { name: "Clock", Icon: Clock },
  { name: "MapPin", Icon: MapPin },
  { name: "BookOpen", Icon: BookOpen },
  { name: "User", Icon: User },
  { name: "Settings", Icon: Settings },
  { name: "Bell", Icon: Bell },
  { name: "Search", Icon: Search },
  { name: "ChevronDown", Icon: ChevronDown },
  { name: "ChevronRight", Icon: ChevronRight },
  { name: "X", Icon: X },
  { name: "Check", Icon: Check },
  { name: "AlertCircle", Icon: AlertCircle },
  { name: "Info", Icon: Info },
  { name: "Moon", Icon: Moon },
  { name: "Sun", Icon: Sun },
];

const NavigationSections = [
  { id: "overview", label: "Overview", Icon: Sparkle },
  { id: "colours", label: "Colour", Icon: Aperture },
  { id: "typography", label: "Typography", Icon: TypeIcon },
  { id: "spacing", label: "Spacing", Icon: Ruler },
  { id: "radius", label: "Radius", Icon: CornerDownRight },
  { id: "Shadows", label: "Elevation", Icon: Layers },
  { id: "motion", label: "Motion", Icon: Zap },
  { id: "icons", label: "Icons", Icon: Component },
  { id: "components", label: "Components", Icon: Box },
  { id: "voice", label: "Voice & Tone", Icon: MessageSquare },
  { id: "accessibility", label: "Accessibility", Icon: Eye },
  { id: "responsive", label: "Responsive", Icon: Globe },
];

const VoiceAndTone = [
  {
    situation: "Onboarding / empty states",
    tone: "Warm, encouraging, action-oriented",
    example:
      "Add your first module to get started. UMTAS will build your best possible timetable.",
  },
  {
    situation: "Informational labels / tooltips",
    tone: "Neutral, precise, no filler words",
    example: "Venue: CS Lecture Hall 1 · Capacity: 120",
  },
  {
    situation: "Error messages",
    tone: "Honest, calm, tells the user what to do next",
    example: "Module code not found. Check the UP handbook or try COS301.",
  },
  {
    situation: "Success feedback",
    tone: "Brief, affirmative, not over-celebratory",
    example: "Timetable saved.",
  },
  {
    situation: "Security / destructive actions",
    tone: "Sober, direct, no softening language",
    example: "Delete this schedule? This cannot be undone.",
  },
];

const AccessibilityRules = [
  {
    Icon: Eye,
    label: "Colour Contrast",
    sub: "WCAG 2.2 AA",
    body: "Body text: 4.5:1 minimum. Large text (Display, H1, H2): 3:1 minimum. Never use --text-secondary for body copy.",
  },
  {
    Icon: Keyboard,
    label: "Keyboard Nav",
    sub: "Tab-reachable",
    body: "Every interactive element reachable by Tab. Focus ring always visible. No keyboard traps anywhere.",
  },
  {
    Icon: SquareCode,
    label: "Semantics",
    sub: "Meaningful markup",
    body: "Use <nav>, <main>, <section>, <button>. Icon-only buttons need aria-label. Inputs need <label>. Placeholder ≠ label.",
  },
  {
    Icon: Zap,
    label: "Motion",
    sub: "prefers-reduced-motion",
    body: "All CSS transitions suppressed at 0.01ms under reduced-motion. Only opacity and transform are ever animated.",
  },
];

const Breakpoint = [
  {
    bp: "Mobile",
    width: "< 640px",
    cols: "1",
    behaviour:
      "Single column. Nav collapses to hamburger. Cards stack full-width. Schedule grid scrolls horizontally.",
  },
  {
    bp: "Tablet",
    width: "640px – 1024px",
    cols: "2",
    behaviour:
      "2-column card grid. Sticky nav remains visible. Schedule grid scrolls horizontally.",
  },
  {
    bp: "Desktop",
    width: "> 1024px",
    cols: "12",
    behaviour:
      "Full 12-column grid. Max-width 1280px centered. Primary design target.",
  },
];

// contrast ratio helper

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [r, g, b];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);

  function toLinear(channel: number): number {
    const s = channel / 255;
    if (s <= 0.03928) {
      return s / 12.92;
    }
    return Math.pow((s + 0.055) / 1.055, 2.4);
  }

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);

  let hi: number;
  let lo: number;

  if (la > lb) {
    hi = la;
    lo = lb;
  } else {
    hi = lb;
    lo = la;
  }

  return (hi + 0.05) / (lo + 0.05);
}

// reveal for scroll visibility coolness

function useReveal(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );

    obs.observe(el);

    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// section shell

function SectionShell({
  id,
  index,
  label,
  title,
  description,
  alt,
  children,
}: {
  id: string;
  index: string;
  label: string;
  title: string;
  description?: string;
  alt?: boolean;
  children: ReactNode;
}) {
  const { ref, visible } = useReveal(0.04);

  let sectionBg = "var(--bg-base)";
  if (alt) {
    sectionBg = "var(--bg-surface)";
  }

  let opacity = 0;
  if (visible) {
    opacity = 1;
  }

  let translateY = "translateY(20px)";
  if (visible) {
    translateY = "translateY(0)";
  }

  let marginBottomDescription = 48;
  if (description) {
    marginBottomDescription = 12;
  }

  return (
    <section
      id={id}
      className="umtas-section"
      style={{
        padding: "96px 0 80px",
        borderBottom: "1px solid var(--border)",
        backgroundColor: sectionBg,
        position: "relative",
      }}
    >
      <div
        ref={ref}
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 32px",
          opacity: opacity,
          transform: translateY,
          transition:
            "opacity 600ms var(--easing-default), transform 600ms var(--easing-default)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 24,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: "var(--text-disabled)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {index}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-secondary)",
            }}
          >
            {label}
          </span>
        </div>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: marginBottomDescription,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            maxWidth: 720,
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              fontSize: 15,
              fontWeight: 400,
              color: "var(--text-secondary)",
              marginBottom: 48,
              lineHeight: 1.6,
              maxWidth: 640,
            }}
          >
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

// micro label

function MicroLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "var(--text-secondary)",
        ...style,
      }}
    >
      {children}
    </p>
  );
}

// interactive colour tokens

function ColourToken({
  token,
  isExpanded,
  onSelect,
  copied,
  onCopy,
}: {
  token: Token;
  isExpanded: boolean;
  onSelect: () => void;
  copied: boolean;
  onCopy: (e: React.MouseEvent) => void;
}) {
  let rowBg = "transparent";
  if (isExpanded) {
    rowBg = "var(--bg-elevated)";
  }

  let CopyIcon = <Copy size={12} />;
  if (copied) {
    CopyIcon = <Check size={12} />;
  }

  return (
    <div
      onClick={onSelect}
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr auto",
        alignItems: "center",
        gap: 14,
        padding: "10px 12px",
        borderRadius: 8,
        backgroundColor: rowBg,
        cursor: "pointer",
        transition:
          "background-color var(--duration-fast) var(--easing-default)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 6,
          backgroundColor: token.hex,
          border: "1px solid rgba(127,127,127,0.18)",
          flexShrink: 0,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      />
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-primary)",
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {token.hex}
        </p>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--text-secondary)",
            margin: "2px 0 0",
          }}
        >
          {token.label}
        </p>
      </div>
      <button
        onClick={onCopy}
        aria-label={`Copy ${token.hex}`}
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          border: "1px solid var(--border)",
          backgroundColor: "transparent",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontFamily: "inherit",
          transition:
            "background-color var(--duration-fast) var(--easing-default), color var(--duration-fast) var(--easing-default)",
        }}
      >
        {CopyIcon}
      </button>
    </div>
  );
}

// motion demo button

function MotionDemoButton({
  label,
  durationMs,
  reducedMotion,
}: {
  label: string;
  durationMs: number;
  reducedMotion: boolean;
}) {
  const [animating, setAnimating] = useState(false);

  function trigger() {
    if (reducedMotion) {
      return;
    }

    setAnimating(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimating(true));
    });
    setTimeout(() => setAnimating(false), durationMs + 50);
  }

  let buttonBg = "var(--bg-surface)";
  if (animating) {
    buttonBg = "var(--bg-elevated)";
  }

  let buttonTransform = "translateY(0) scale(1)";
  if (animating) {
    buttonTransform = "translateY(-2px) scale(0.98)";
  }

  return (
    <button
      onClick={trigger}
      style={{
        height: 36,
        padding: "0 16px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        backgroundColor: buttonBg,
        color: "var(--text-primary)",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        transform: buttonTransform,
        transition: `transform ${durationMs}ms var(--easing-default), background-color ${durationMs}ms var(--easing-default)`,
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

// schedule preview

type Session = {
  day: number;
  startSlot: number;
  span: number;
  code: string;
  kind: string;
};

const HeroSessions: Session[] = [
  { day: 0, startSlot: 0, span: 1, code: "COS301", kind: "Lecture A" },
  { day: 0, startSlot: 2, span: 2, code: "COS333", kind: "Lab" },
  { day: 1, startSlot: 1, span: 2, code: "COS344", kind: "Lecture" },
  { day: 1, startSlot: 4, span: 1, code: "COS314", kind: "Tutorial" },
  { day: 2, startSlot: 0, span: 1, code: "COS301", kind: "Lecture B" },
  { day: 2, startSlot: 3, span: 2, code: "COS330", kind: "Lecture" },
  { day: 3, startSlot: 1, span: 1, code: "COS332", kind: "Lecture" },
  { day: 3, startSlot: 4, span: 1, code: "COS301", kind: "Lab" },
  { day: 4, startSlot: 2, span: 1, code: "COS344", kind: "Lecture" },
];

function RowFragment({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function HeroScheduleGrid({ reducedMotion }: { reducedMotion: boolean }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const slots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"];
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(() => setRevealed(true), 0);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(t);
  }, [reducedMotion]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px repeat(5, 1fr)",
        gridTemplateRows: `22px repeat(${slots.length - 1}, 56px)`,
        gap: 4,
        width: "100%",
      }}
    >
      <div />

      {/* day headers */}
      {days.map((d, i) => {
        let headerOpacity = 0;
        if (revealed) {
          headerOpacity = 1;
        }

        let headerTransform = "translateY(-4px)";
        if (revealed) {
          headerTransform = "translateY(0)";
        }

        let headerTransition = `opacity 400ms var(--easing-default) ${i * 30}ms, transform 400ms var(--easing-default) ${i * 30}ms`;
        if (reducedMotion) {
          headerTransition = "none";
        }

        return (
          <div
            key={d}
            style={{
              fontSize: 10,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#9a9a9a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: headerOpacity,
              transform: headerTransform,
              transition: headerTransition,
            }}
          >
            {d}
          </div>
        );
      })}

      {/* slot rows */}
      {slots.slice(0, -1).map((slot, rowIdx) => {
        let timeLabelOpacity = 0;
        if (revealed) {
          timeLabelOpacity = 1;
        }

        let timeLabelTransition = `opacity 400ms var(--easing-default) ${100 + rowIdx * 20}ms`;
        if (reducedMotion) {
          timeLabelTransition = "none";
        }

        return (
          <RowFragment key={`row-${slot}`}>
            {/* time lbl */}
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: "#9a9a9a",
                display: "flex",
                alignItems: "flex-start",
                paddingTop: 4,
                fontVariantNumeric: "tabular-nums",
                opacity: timeLabelOpacity,
                transition: timeLabelTransition,
              }}
            >
              {slot}
            </div>

            {/* cells */}
            {days.map((_, dayIdx) => {
              const key = `${dayIdx}-${rowIdx}`;
              const delayMs = 200 + dayIdx * 50 + rowIdx * 30;

              let session: Session | undefined = undefined;
              for (const s of HeroSessions) {
                if (s.day === dayIdx && s.startSlot === rowIdx) {
                  session = s;
                  break;
                }
              }

              let coveredBy: Session | undefined = undefined;
              for (const s of HeroSessions) {
                if (
                  s.day === dayIdx &&
                  s.startSlot < rowIdx &&
                  s.startSlot + s.span > rowIdx
                ) {
                  coveredBy = s;
                  break;
                }
              }

              if (coveredBy !== undefined) {
                return null;
              }

              if (session !== undefined) {
                const isHovered = hoveredKey === key;

                let cellBg = "#3f3f46";
                if (isHovered) {
                  cellBg = "#52525b";
                }

                let cellOpacity = 0;
                if (revealed) {
                  cellOpacity = 1;
                }

                let cellTransform = "translateY(4px) scale(0.98)";
                if (revealed && isHovered) {
                  cellTransform = "translateY(-1px)";
                } else if (revealed) {
                  cellTransform = "translateY(0)";
                }

                let cellTransition = `opacity 400ms var(--easing-default) ${delayMs}ms, transform 250ms var(--easing-default), background-color 150ms var(--easing-default)`;
                if (reducedMotion) {
                  cellTransition = "none";
                }

                return (
                  <div
                    key={key}
                    onMouseEnter={() => setHoveredKey(key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    style={{
                      gridRow: `span ${session.span}`,
                      backgroundColor: cellBg,
                      borderRadius: 4,
                      padding: "8px 10px",
                      cursor: "pointer",
                      transform: cellTransform,
                      opacity: cellOpacity,
                      transition: cellTransition,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      minHeight: 0,
                      overflow: "hidden",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#e8e8e8",
                        lineHeight: 1.3,
                      }}
                    >
                      {session.code}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 400,
                        color: "#9a9a9a",
                        lineHeight: 1.4,
                        marginTop: 2,
                      }}
                    >
                      {session.kind}
                    </span>
                  </div>
                );
              }

              // empty cell
              let emptyCellOpacity = 0;
              if (revealed) {
                emptyCellOpacity = 0.4;
              }

              let emptyCellTransition = `opacity 400ms var(--easing-default) ${delayMs}ms`;
              if (reducedMotion) {
                emptyCellTransition = "none";
              }

              return (
                <div
                  key={key}
                  style={{
                    backgroundColor: "#27272a",
                    borderRadius: 4,
                    opacity: emptyCellOpacity,
                    transition: emptyCellTransition,
                  }}
                />
              );
            })}
          </RowFragment>
        );
      })}
    </div>
  );
}

// schedule grid for components section

function ScheduleGridDemo() {
  const days = ["Mon", "Tue", "Wed"];
  const slots = ["08:00", "09:00", "10:00", "11:00"];

  const sessions: Session[] = [
    { day: 0, startSlot: 0, span: 1, code: "COS301", kind: "Lec A" },
    { day: 1, startSlot: 1, span: 2, code: "COS333", kind: "Lab" },
  ];

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "44px repeat(3, 1fr)",
          gridTemplateRows: `22px repeat(${slots.length}, 40px)`,
          gap: 4,
        }}
      >
        <div />
        {days.map((d) => (
          <div
            key={d}
            style={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--text-secondary)",
              textAlign: "center",
            }}
          >
            {d}
          </div>
        ))}

        {slots.map((slot, rowIdx) => (
          <RowFragment key={`r-${slot}`}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
              }}
            >
              {slot}
            </div>

            {days.map((_, dayIdx) => {
              let session: Session | undefined = undefined;
              for (const s of sessions) {
                if (s.day === dayIdx && s.startSlot === rowIdx) {
                  session = s;
                  break;
                }
              }

              let coveredBy: Session | undefined = undefined;
              for (const s of sessions) {
                if (
                  s.day === dayIdx &&
                  s.startSlot < rowIdx &&
                  s.startSlot + s.span > rowIdx
                ) {
                  coveredBy = s;
                  break;
                }
              }

              if (coveredBy !== undefined) {
                return null;
              }

              if (session !== undefined) {
                return (
                  <div
                    key={`${dayIdx}-${rowIdx}`}
                    style={{
                      gridRow: `span ${session.span}`,
                      backgroundColor: "var(--bg-elevated)",
                      borderRadius: 4,
                      padding: "6px 8px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        lineHeight: 1.3,
                      }}
                    >
                      {session.code}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 400,
                        color: "var(--text-secondary)",
                        lineHeight: 1.4,
                      }}
                    >
                      {session.kind}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={`${dayIdx}-${rowIdx}`}
                  style={{
                    backgroundColor: "var(--bg-base)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                  }}
                />
              );
            })}
          </RowFragment>
        ))}
      </div>
    </div>
  );
}

// colours

function ColoursSection() {
  const [selectedToken, setSelectedToken] = useState<string>("--text-primary");
  const [activeMode, setActiveMode] = useState<Theme>("light");
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopy = useCallback((hex: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(hex);
    }
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1200);
  }, []);

  let palette: Token[];
  if (activeMode === "light") {
    palette = LightPalette;
  } else {
    palette = DarkPalette;
  }

  let selected: Token = palette[0];
  for (const t of palette) {
    if (t.token === selectedToken) {
      selected = t;
      break;
    }
  }

  let bgToken: Token = palette[0];
  for (const t of palette) {
    if (t.token === "--bg-base") {
      bgToken = t;
      break;
    }
  }

  let surfaceToken: Token = palette[0];
  for (const t of palette) {
    if (t.token === "--bg-surface") {
      surfaceToken = t;
      break;
    }
  }

  const bg = bgToken.hex;
  const surface = surfaceToken.hex;
  const ratio = contrastRatio(selected.hex, bg);
  const ratioSurface = contrastRatio(selected.hex, surface);

  return (
    <SectionShell
      id="colours"
      index="01"
      label="Foundation"
      title="A monochrome system, intentionally restrained."
      description="No hue-based accents anywhere. Hierarchy comes from tone, weight and spacing. The discipline is what makes the interface feel institutional-grade without being cold."
    >
      {/* mode tabs */}
      <div
        style={{
          display: "inline-flex",
          padding: 4,
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          marginBottom: 24,
        }}
      >
        {(["light", "dark"] as const).map((m) => {
          let tabBg = "transparent";
          if (activeMode === m) {
            tabBg = "var(--bg-base)";
          }

          let tabColor = "var(--text-secondary)";
          if (activeMode === m) {
            tabColor = "var(--text-primary)";
          }

          let tabShadow = "none";
          if (activeMode === m) {
            tabShadow = "0 1px 2px rgba(0,0,0,0.06)";
          }

          return (
            <button
              key={m}
              onClick={() => setActiveMode(m)}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                backgroundColor: tabBg,
                color: tabColor,
                boxShadow: tabShadow,
                transition: "all var(--duration-fast) var(--easing-default)",
                textTransform: "capitalize",
              }}
            >
              {m} Mode
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)",
          gap: 24,
          marginBottom: 48,
        }}
        className="colours-grid"
      >
        {/* token list */}
        <div
          data-theme={activeMode}
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          {palette.map((t) => {
            let isCopied = false;
            if (copiedHex === t.hex) {
              isCopied = true;
            }

            return (
              <ColourToken
                key={t.token}
                token={t}
                isExpanded={selectedToken === t.token}
                onSelect={() => setSelectedToken(t.token)}
                copied={isCopied}
                onCopy={(e) => {
                  e.stopPropagation();
                  handleCopy(t.hex);
                }}
              />
            );
          })}
        </div>

        {/* inspector */}
        <div
          data-theme={activeMode}
          style={{
            backgroundColor: "var(--bg-base)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 28,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <MicroLabel style={{ marginBottom: 8 }}>Token Inspector</MicroLabel>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 24,
              paddingBottom: 24,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 10,
                backgroundColor: selected.hex,
                border: "1px solid rgba(127,127,127,0.18)",
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {selected.label}
              </p>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: "var(--text-secondary)",
                  margin: "4px 0 0",
                  fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                }}
              >
                {selected.token} · {selected.hex}
              </p>
            </div>
          </div>

          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            {selected.usage}.
          </p>

          {/* contrast readouts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {[
              { label: "vs Base", ratio: ratio },
              { label: "vs Surface", ratio: ratioSurface },
            ].map(({ label, ratio: ratioValue }) => {
              const passAA = ratioValue >= 4.5;
              const passAALarge = ratioValue >= 3;

              let aaBg = "";
              let aaColor = "";
              let aaLargeBg = "";
              let aaLargeColor = "";

              if (activeMode === "light") {
                if (passAA) {
                  aaBg = "#dcfce7";
                  aaColor = "#15803d";
                } else {
                  aaBg = "#fef3c7";
                  aaColor = "#b45309";
                }

                if (passAALarge) {
                  aaLargeBg = "#dcfce7";
                  aaLargeColor = "#15803d";
                } else {
                  aaLargeBg = "#fee2e2";
                  aaLargeColor = "#991b1b";
                }
              } else {
                if (passAA) {
                  aaBg = "#14532d";
                  aaColor = "#86efac";
                } else {
                  aaBg = "#c2410c";
                  aaColor = "#fcd34d";
                }

                if (passAALarge) {
                  aaLargeBg = "#14532d";
                  aaLargeColor = "#86efac";
                } else {
                  aaLargeBg = "#7f1d1d";
                  aaLargeColor = "#fca5a5";
                }
              }

              let aaLabel = "AA -";
              if (passAA) {
                aaLabel = "AA ✓";
              }

              let aaLargeLabel = "AA Lrg -";
              if (passAALarge) {
                aaLargeLabel = "AA Lrg ✓";
              }

              return (
                <div
                  key={label}
                  style={{
                    padding: 14,
                    backgroundColor: "var(--bg-surface)",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <MicroLabel style={{ marginBottom: 6 }}>{label}</MicroLabel>
                  <p
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      margin: 0,
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: 1.2,
                    }}
                  >
                    {ratioValue.toFixed(2)}
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        fontWeight: 400,
                      }}
                    >
                      {" "}
                      : 1
                    </span>
                  </p>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        padding: "2px 8px",
                        borderRadius: 9999,
                        backgroundColor: aaBg,
                        color: aaColor,
                      }}
                    >
                      {aaLabel}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        padding: "2px 8px",
                        borderRadius: 9999,
                        backgroundColor: aaLargeBg,
                        color: aaLargeColor,
                      }}
                    >
                      {aaLargeLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* status colours */}
      <MicroLabel style={{ marginBottom: 12 }}>
        Status Colours · the only permitted hue exceptions
      </MicroLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
        className="status-grid"
      >
        {StatusColours.map((s) => (
          <div
            key={s.label}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div
                style={{
                  backgroundColor: s.light.bg,
                  padding: "14px 16px",
                  borderRight: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    color: s.light.text,
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {s.label}
                </span>
              </div>
              <div
                style={{
                  backgroundColor: s.dark.bg,
                  padding: "14px 16px",
                }}
              >
                <span
                  style={{
                    color: s.dark.text,
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {s.label}
                </span>
              </div>
            </div>
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "var(--bg-surface)",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-secondary)",
                  fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {s.light.bg} / {s.dark.bg}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// typography

function TypographySection() {
  const [scaleFactor, setScaleFactor] = useState(1);

  return (
    <SectionShell
      id="typography"
      index="02"
      label="Foundation"
      title="DM Sans, three weights, seven sizes."
      description="A single typeface across the entire system. Hierarchy through weight and size - never through colour or decoration. Drag the slider to see the scale at different base sizes."
      alt
    >
      {/* scale slider (please work now) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 32,
          padding: "16px 20px",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          maxWidth: 480,
        }}
      >
        <MicroLabel style={{ flexShrink: 0 }}>Scale</MicroLabel>
        <input
          type="range"
          min="0.75"
          max="1.5"
          step="0.05"
          value={scaleFactor}
          onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
          aria-label="Adjust type scale preview"
          style={{
            flex: 1,
            accentColor: "var(--text-primary)",
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-primary)",
            fontVariantNumeric: "tabular-nums",
            minWidth: 48,
            textAlign: "right",
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          }}
        >
          {scaleFactor.toFixed(2)}×
        </span>
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        {TypeScale.map((t, i) => {
          let rowBg = "var(--bg-surface)";
          if (i % 2 !== 0) {
            rowBg = "var(--bg-base)";
          }

          let textTransform: "uppercase" | undefined = undefined;
          if (t.micro) {
            textTransform = "uppercase";
          }

          let borderBottom = "1px solid var(--border)";
          if (i >= TypeScale.length - 1) {
            borderBottom = "none";
          }

          return (
            <div
              key={t.role}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 200px",
                alignItems: "baseline",
                gap: 24,
                padding: "28px 28px",
                borderBottom: borderBottom,
                backgroundColor: rowBg,
                transition:
                  "background-color var(--duration-fast) var(--easing-default)",
              }}
            >
              <p
                style={{
                  fontSize: t.size * scaleFactor,
                  fontWeight: t.weight,
                  lineHeight: t.lh,
                  letterSpacing: t.ls,
                  color: "var(--text-primary)",
                  textTransform: textTransform,
                  margin: 0,
                  minWidth: 0,
                }}
              >
                {t.sample}
              </p>
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  {t.role}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--text-disabled)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    margin: "4px 0 0",
                    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                  }}
                >
                  {t.size}px · {t.weight} · {t.lh}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

// spacing section

function SpacingSection() {
  const [hovered, setHovered] = useState<string | null>(null);

  let activeTokenName = "space-4";
  if (hovered !== null) {
    activeTokenName = hovered;
  }

  let activeToken = SpacingTokens[0];
  for (const s of SpacingTokens) {
    if (s.token === activeTokenName) {
      activeToken = s;
      break;
    }
  }

  return (
    <SectionShell
      id="spacing"
      index="03"
      label="Rhythm"
      title="A 4px base unit. Every margin and padding."
      description="UMTAS displays scheduling data - modules, slots, days, venues. Density without crowding requires a strict spacing rhythm. Hover the tokens to see them applied to a live card."
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)",
          gap: 32,
          alignItems: "flex-start",
        }}
        className="spacing-grid"
      >
        {/* Token list bars */}
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SpacingTokens.map((t) => {
              let rowBg = "transparent";
              if (hovered === t.token) {
                rowBg = "var(--bg-surface)";
              }

              return (
                <div
                  key={t.token}
                  onMouseEnter={() => setHovered(t.token)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 1fr 60px",
                    alignItems: "center",
                    gap: 16,
                    padding: "10px 12px",
                    borderRadius: 8,
                    backgroundColor: rowBg,
                    cursor: "pointer",
                    transition:
                      "background-color var(--duration-fast) var(--easing-default)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                    }}
                  >
                    {t.token}
                  </span>
                  <div
                    style={{
                      height: 8,
                      width: `${(t.px / 48) * 100}%`,
                      backgroundColor: "var(--text-primary)",
                      borderRadius: 2,
                      transition:
                        "width var(--duration-normal) var(--easing-default)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      fontVariantNumeric: "tabular-nums",
                      textAlign: "right",
                    }}
                  >
                    {t.px}px
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* live preview card */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <MicroLabel style={{ marginBottom: 4 }}>
            Applied as Padding
          </MicroLabel>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-primary)",
              fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
              margin: "0 0 16px",
            }}
          >
            padding:{" "}
            <span style={{ color: "var(--text-secondary)" }}>
              {activeToken.px}px
            </span>
            ;
          </p>
          <div
            style={{
              border: "1px dashed var(--border)",
              borderRadius: 8,
              padding: activeToken.px,
              transition:
                "padding var(--duration-normal) var(--easing-default)",
              backgroundColor: "var(--bg-base)",
              minHeight: 140,
            }}
          >
            <div
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderRadius: 6,
                padding: "12px 16px",
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                COS301 · Lecture A
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  margin: "4px 0 0",
                  lineHeight: 1.5,
                }}
              >
                Software Engineering · 08:00–09:00
              </p>
            </div>
          </div>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              margin: "16px 0 0",
              lineHeight: 1.5,
            }}
          >
            {activeToken.usage}
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

// radius section

function RadiusSection() {
  return (
    <SectionShell
      id="radius"
      index="04"
      label="Form"
      title="Eight pixels, with three exceptions."
      description="The shadcn radius system. Every element shares a single radius value unless explicitly listed below."
      alt
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 16,
        }}
      >
        {RadiusElements.map((r) => {
          let borderRadius: number | string = r.radiusPx;
          if (r.radiusPx === 9999) {
            borderRadius = 9999;
          }

          return (
            <div
              key={r.name}
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "24px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 56,
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: borderRadius,
                }}
              />
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {r.name}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    margin: "4px 0 0",
                    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                  }}
                >
                  {r.px}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

// shadows section

function ShadowsSection() {
  return (
    <SectionShell
      id="Shadows"
      index="05"
      label="Depth"
      title="Four levels. Subtle by default."
      description="Cards feel lifted, never floating. In dark mode, shadow alpha is doubled for visibility against the charcoal base."
    >
      <div style={{ marginBottom: 40 }}>
        <MicroLabel style={{ marginBottom: 12 }}>
          Both modes shown together
        </MicroLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          {Shadows.map(({ level, shadow, usage }) => (
            <div
              key={level}
              style={{
                backgroundColor: "var(--bg-surface)",
                borderRadius: 8,
                padding: 16,
                boxShadow: shadow,
                border: "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  margin: "0 0 4px",
                }}
              >
                {level}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {usage}
              </p>
            </div>
          ))}
        </div>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            marginTop: 12,
            lineHeight: 1.5,
          }}
        >
          Toggle light/dark mode via the nav above to see shadow visibility
          differences. Dark mode uses ~2× alpha values.
        </p>
      </div>
    </SectionShell>
  );
}

// motion section

function MotionSection({ reducedMotion }: { reducedMotion: boolean }) {
  let motionDemoContent: ReactNode;

  if (reducedMotion) {
    motionDemoContent = (
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Info size={14} style={{ color: "var(--text-secondary)" }} />
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          Motion demos suspended - reduced motion preference detected.
        </p>
      </div>
    );
  } else {
    motionDemoContent = (
      <>
        {MotionTokens.map((m) => (
          <MotionDemoButton
            key={m.token}
            label={`${m.token.replace("--duration-", "")} · ${m.value}ms`}
            durationMs={m.value}
            reducedMotion={reducedMotion}
          />
        ))}
      </>
    );
  }

  return (
    <SectionShell
      id="motion"
      index="06"
      label="Behaviour"
      title="Motion is a design dimension."
      description="Three durations, one easing curve. Click any button below to feel the difference. Layout-affecting properties are never animated - only opacity and transform."
      alt
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 40,
          flexWrap: "wrap",
        }}
      >
        {motionDemoContent}
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "200px 100px 1fr",
            padding: "12px 20px",
            backgroundColor: "var(--bg-surface)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {["Token", "Value", "Usage"].map((h) => (
            <span
              key={h}
              style={{
                fontSize: 11,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--text-secondary)",
              }}
            >
              {h}
            </span>
          ))}
        </div>
        {MotionTokens.map((m, i) => {
          let borderBottom = "1px solid var(--border)";
          if (i >= MotionTokens.length - 1) {
            borderBottom = "none";
          }

          return (
            <div
              key={m.token}
              style={{
                display: "grid",
                gridTemplateColumns: "200px 100px 1fr",
                padding: "14px 20px",
                borderBottom: borderBottom,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                }}
              >
                {m.token}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                }}
              >
                {m.value}ms
              </span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {m.usage}
              </span>
            </div>
          );
        })}
      </div>

      <p
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          marginTop: 20,
          lineHeight: 1.6,
        }}
      >
        Easing:{" "}
        <code
          style={{
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: 12,
            padding: "2px 6px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: 4,
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        >
          cubic-bezier(0.4, 0, 0.2, 1)
        </code>{" "}
        for all transitions. No linear, no ease-in, no ease-out.
      </p>
    </SectionShell>
  );
}

// icons section

function IconsSection() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const results = [];
    for (const icon of IconDefinitions) {
      if (icon.name.toLowerCase().includes(q)) {
        results.push(icon);
      }
    }
    return results;
  }, [query]);

  return (
    <SectionShell
      id="icons"
      index="07"
      label="Library"
      title="Lucide, outline only, never independently coloured."
      description="Icons inherit the colour of the text they accompany. 16px in body and tables, 20px in headings and navigation."
    >
      <div style={{ marginBottom: 20, position: "relative", maxWidth: 320 }}>
        <Search
          size={14}
          style={{
            position: "absolute",
            top: "50%",
            left: 12,
            transform: "translateY(-50%)",
            color: "var(--text-secondary)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter icons"
          aria-label="Filter icons"
          style={{
            width: "100%",
            height: 36,
            padding: "0 12px 0 34px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-base)",
            color: "var(--text-primary)",
            fontSize: 14,
            fontFamily: "inherit",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 8,
        }}
      >
        {filtered.map(({ name, Icon }) => (
          <div
            key={name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 8,
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
              transition:
                "background-color var(--duration-fast) var(--easing-default)",
            }}
          >
            <Icon
              size={18}
              style={{ color: "var(--text-primary)", flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-secondary)",
                lineHeight: 1.3,
                fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </span>
          </div>
        ))}

        {filtered.length === 0 && (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              gridColumn: "1 / -1",
              padding: 24,
              textAlign: "center",
            }}
          >
            No icons match &ldquo;{query}&rdquo;.
          </p>
        )}
      </div>
    </SectionShell>
  );
}

// voice and tone

function VoiceToneSection() {
  return (
    <SectionShell
      id="voice"
      index="09"
      label="Communication"
      title="How UMTAS speaks."
      description="Voice is constant personality. Tone adjusts to the situation. Together they make every message feel purposeful, never generic."
      alt
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          marginBottom: 48,
        }}
      >
        {VoiceAndTone.map((v, i) => {
          let borderBottom = "1px solid var(--border)";
          if (i >= VoiceAndTone.length - 1) {
            borderBottom = "none";
          }

          return (
            <div
              key={v.situation}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(200px, 240px) 1fr minmax(0, 1.4fr)",
                gap: 24,
                padding: "20px 0",
                borderBottom: borderBottom,
                alignItems: "start",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {v.situation}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    margin: 0,
                    lineHeight: 1.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {v.tone}
                </p>
              </div>
              <div
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-primary)",
                    margin: 0,
                    lineHeight: 1.6,
                    fontStyle: "normal",
                  }}
                >
                  &ldquo;{v.example}&rdquo;
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <MicroLabel style={{ marginBottom: 16 }}>Writing Rules</MicroLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {[
          {
            rule: "Plain English only",
            detail:
              "No jargon unless domain-specific. 'Module', 'venue', 'timetable slot' are fine.",
          },
          {
            rule: "Errors explain and instruct",
            detail:
              "Every error message states the cause and the next action. Never 'Something went wrong.'",
          },
          {
            rule: "Descriptive placeholders",
            detail:
              "e.g. COS301 - not 'Enter something here'. Placeholder text is instructional.",
          },
          {
            rule: "Labels are nouns, buttons are verbs",
            detail:
              "'Save changes', 'Delete module', 'View timetable' - not 'Submit' or 'Click here'.",
          },
        ].map((r) => (
          <div
            key={r.rule}
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "16px 18px",
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-primary)",
                margin: "0 0 6px",
                lineHeight: 1.4,
              }}
            >
              {r.rule}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {r.detail}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// accessibility

function AccessibilitySection() {
  return (
    <SectionShell
      id="accessibility"
      index="10"
      label="Inclusion"
      title="WCAG 2.2 AA. Baked in, not bolted on."
      description="Accessibility is a system property. Every token, every component, every pattern is designed to meet AA by default."
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 48,
        }}
      >
        {AccessibilityRules.map(({ Icon: RuleIcon, label, sub, body }) => (
          <div
            key={label}
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "20px 20px 22px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: "var(--bg-elevated)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <RuleIcon size={15} style={{ color: "var(--text-primary)" }} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    margin: "2px 0 0",
                  }}
                >
                  {sub}
                </p>
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {body}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

//responsive

function ResponsiveSection() {
  return (
    <SectionShell
      id="responsive"
      index="11"
      label="Layout"
      title="Desktop-primary. Mobile-ready."
      description="Three Breakpoint. The schedule grid and dense data views are designed for desktop first, but every screen reflowing correctly at tablet and mobile widths is a requirement."
      alt
    >
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 160px 60px 1fr",
            padding: "12px 20px",
            backgroundColor: "var(--bg-surface)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {["Breakpoint", "Width", "Cols", "Behaviour"].map((h) => (
            <span
              key={h}
              style={{
                fontSize: 11,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--text-secondary)",
              }}
            >
              {h}
            </span>
          ))}
        </div>
        {Breakpoint.map((b, i) => {
          let borderBottom = "1px solid var(--border)";
          if (i >= Breakpoint.length - 1) {
            borderBottom = "none";
          }

          return (
            <div
              key={b.bp}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 160px 60px 1fr",
                padding: "16px 20px",
                borderBottom: borderBottom,
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                {b.bp}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                }}
              >
                {b.width}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {b.cols}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {b.behaviour}
              </span>
            </div>
          );
        })}
      </div>

      <MicroLabel style={{ marginBottom: 12 }}>
        Tailwind Prefix Reference
      </MicroLabel>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { prefix: "sm:", width: "640px" },
          { prefix: "md:", width: "768px" },
          { prefix: "lg:", width: "1024px" },
          { prefix: "xl:", width: "1280px" },
        ].map((bp) => (
          <div
            key={bp.prefix}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 6,
            }}
          >
            <code
              style={{
                fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                fontSize: 13,
                color: "var(--text-primary)",
                fontWeight: 500,
              }}
            >
              {bp.prefix}
            </code>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-disabled)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {bp.width}
            </span>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// components

export function ComponentsSection() {
  const sectionHeadingStyle = {
    fontSize: 18,
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: "32px 0 16px",
  };

  const componentPanelStyle = {
    backgroundColor: "var(--bg-base)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 28,
    marginBottom: 40,
  };

  return (
    <SectionShell
      id="components"
      index="08"
      label="Library"
      title="Components. All token-driven."
      description="Every component shown using the active theme. Toggle light/dark via the nav bar. Nothing is hardcoded - all values come from the tokens above."
    >
      <h3 style={{ ...sectionHeadingStyle, marginTop: 0 }}>Buttons</h3>
      <div style={componentPanelStyle}>
        <div className="flex flex-wrap gap-2 mb-3">
          <Button>Save changes</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Learn more</Button>
          <Button variant="destructive">Delete module</Button>
        </div>
      </div>

      <h3 style={sectionHeadingStyle}>Badges</h3>
      <div style={componentPanelStyle}>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className="uppercase tracking-[0.04em] text-[10px]"
          >
            Neutral
          </Badge>
          <Badge
            variant="destructive"
            className="uppercase tracking-[0.04em] text-[10px]"
          >
            Error
          </Badge>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400 border-transparent uppercase tracking-[0.04em] text-[10px]">
            Success
          </Badge>
          <Badge
            variant="outline"
            className="uppercase tracking-[0.04em] text-[10px]"
          >
            Outline
          </Badge>
        </div>
      </div>

      <h3 style={sectionHeadingStyle}>Cards</h3>
      <div style={componentPanelStyle}>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-muted-foreground" />
              <CardTitle className="text-lg leading-[1.3]">
                COS301 · Software Engineering
              </CardTitle>
            </div>
            <CardDescription className="text-sm">
              Lecture A · CS Lecture Hall 1 · 08:00 to 09:00
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 border-transparent dark:bg-green-900/30 dark:text-green-400 uppercase tracking-[0.04em] text-[10px] flex items-center gap-1 px-2.5 py-0.5"
              >
                <Check size={10} />
                Confirmed
              </Badge>
              <Button variant="secondary" size="sm" className="h-8 gap-1">
                View details
                <ArrowUpRight size={12} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <h3 style={sectionHeadingStyle}>Tabs</h3>
      <div style={componentPanelStyle}>
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent
            value="account"
            className="text-sm text-muted-foreground mt-4"
          >
            Make changes to your account here. Click save when you&apos;re done.
          </TabsContent>
          <TabsContent
            value="password"
            className="text-sm text-muted-foreground mt-4"
          >
            Change your password here. After saving, you&apos;ll be logged out.
          </TabsContent>
        </Tabs>
      </div>

      <h3 style={sectionHeadingStyle}>Form Inputs</h3>
      <div style={componentPanelStyle}>
        <div className="flex flex-col gap-6">
          <div className="grid w-full items-center gap-1.5">
            <Label className="text-xs text-muted-foreground">Module Code</Label>
            <Input placeholder="e.g. COS301" />
          </div>
          <div className="grid w-full gap-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea placeholder="Type your message here." />
          </div>
          <div className="grid w-full gap-1.5">
            <Label className="text-xs text-muted-foreground">Department</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cs">Computer Science</SelectItem>
                <SelectItem value="math">Mathematics</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <h3 style={sectionHeadingStyle}>Controls</h3>
      <div style={componentPanelStyle}>
        <div className="flex flex-col gap-8">
          <div className="flex items-center space-x-2">
            <Switch id="airplane-mode" />
            <Label htmlFor="airplane-mode">Airplane Mode</Label>
          </div>
          <div className="grid w-full gap-3">
            <Label className="text-xs text-muted-foreground">Volume</Label>
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
          <div className="flex flex-col gap-3">
            <Label className="text-xs text-muted-foreground">Formatting</Label>
            <div className="flex items-center gap-4">
              <Toggle aria-label="Toggle italic">
                <span className="font-serif italic">I</span>
              </Toggle>
              <ToggleGroup type="single" defaultValue="a">
                <ToggleGroupItem value="a">A</ToggleGroupItem>
                <ToggleGroupItem value="b">B</ToggleGroupItem>
                <ToggleGroupItem value="c">C</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </div>

      <h3 style={sectionHeadingStyle}>Data Display &amp; Feedback</h3>
      <div style={componentPanelStyle}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>UM</AvatarFallback>
            </Avatar>
          </div>
          <Alert>
            <AlertTitle>New schedule available!</AlertTitle>
            <AlertDescription>
              Your weekly timetable has been updated for the upcoming semester.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to sync with the central database. Please try again later.
            </AlertDescription>
          </Alert>
          <div className="pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="w-fit">
                    Hover for info
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a helpful tooltip description.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <h3 style={sectionHeadingStyle}>Layout &amp; Loading</h3>
      <div style={componentPanelStyle}>
        <div className="flex flex-col gap-6">
          <div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium leading-none">
                Radix Primitives
              </h4>
              <p className="text-sm text-muted-foreground">
                An open-source UI component library.
              </p>
            </div>
            <Separator className="my-4" />
            <div className="flex h-5 items-center space-x-4 text-sm">
              <div>Blog</div>
              <Separator orientation="vertical" />
              <div>Docs</div>
              <Separator orientation="vertical" />
              <div>Source</div>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </div>
      </div>

      <h3 style={sectionHeadingStyle}>Weekly Schedule Grid</h3>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          margin: "0 0 20px",
          lineHeight: 1.6,
          maxWidth: 640,
        }}
      >
        The core UMTAS component. Cell background, session block and row-span
        behaviour all derive from the tokens above.
      </p>
      <div style={{ marginBottom: 40 }}>
        <ScheduleGridDemo />
      </div>
    </SectionShell>
  );
}

// main

export default function BrandPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [showKbd, setShowKbd] = useState(false);
  const [progress, setProgress] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-30% 0px -65% 0px" },
    );

    for (const section of NavigationSections) {
      const el = document.getElementById(section.id);
      if (el && observerRef.current) {
        observerRef.current.observe(el);
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    function onScroll() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      let pct = 0;
      if (max > 0) {
        pct = (h.scrollTop / max) * 100;
      }
      setProgress(pct);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShowKbd((v) => !v);
      } else if (e.key === "Escape") {
        setShowKbd(false);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  let heroFadeClass = "";
  if (!reducedMotion) {
    heroFadeClass = "umtas-fade-in";
  }

  return (
    <div
      className="umtas-root"
      style={{
        backgroundColor: "var(--bg-base)",
        minHeight: "100vh",
        color: "var(--text-primary)",
      }}
    >
      <style>{`
        .umtas-root {
          font-feature-settings: 'ss01' on, 'cv11' on;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .umtas-section {
          transition: background-color var(--duration-normal) var(--easing-default), border-color var(--duration-normal) var(--easing-default);
        }
        @keyframes umtas-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .umtas-fade-in {
          animation: umtas-fade-up 600ms var(--easing-default) both;
        }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .colours-grid,
          .spacing-grid,
          .theme-pair-grid,
          .status-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: "transparent",
          zIndex: 60,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            backgroundColor: "var(--text-primary)",
            transition: "width 150ms var(--easing-default)",
          }}
        />
      </div>

      <div style={{ display: "flex", maxWidth: 1440, margin: "0 auto" }}>
        <aside
          className="desktop-only"
          style={{
            position: "sticky",
            top: 64,
            alignSelf: "flex-start",
            height: "calc(100vh - 64px)",
            width: 220,
            flexShrink: 0,
            padding: "32px 16px 32px 32px",
            borderRight: "1px solid var(--border)",
            overflowY: "auto",
          }}
        >
          <MicroLabel style={{ marginBottom: 16 }}>Contents</MicroLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {NavigationSections.map(({ id, label, Icon }, idx) => {
              const isActive = activeSection === id;

              let navBg = "transparent";
              if (isActive) {
                navBg = "var(--bg-surface)";
              }

              let navColor = "var(--text-secondary)";
              if (isActive) {
                navColor = "var(--text-primary)";
              }

              let navFontWeight = 400;
              if (isActive) {
                navFontWeight = 500;
              }

              let indicatorBg = "transparent";
              if (isActive) {
                indicatorBg = "var(--text-primary)";
              }

              let iconColor = "var(--text-disabled)";
              if (isActive) {
                iconColor = "var(--text-primary)";
              }

              let indexLabel = String(idx);
              if (idx < 10) {
                indexLabel = "0" + String(idx);
              }

              return (
                <a
                  key={id}
                  href={`#${id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 10px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: navFontWeight,
                    color: navColor,
                    textDecoration: "none",
                    backgroundColor: navBg,
                    transition:
                      "background-color var(--duration-fast) var(--easing-default), color var(--duration-fast) var(--easing-default)",
                    position: "relative",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: -16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 2,
                      height: 16,
                      backgroundColor: indicatorBg,
                      borderRadius: 2,
                      transition:
                        "background-color var(--duration-fast) var(--easing-default)",
                    }}
                  />
                  <Icon size={14} style={{ color: iconColor }} />
                  <span style={{ flex: 1 }}>{label}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: "var(--text-disabled)",
                      fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {indexLabel}
                  </span>
                </a>
              );
            })}
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>
          <section
            id="overview"
            data-theme="dark"
            style={{
              backgroundColor: "#18181b",
              color: "#e8e8e8",
              padding: "80px 32px 96px",
              position: "relative",
              overflow: "hidden",
              borderBottom: "1px solid #3f3f46",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "linear-gradient(#27272a 1px, transparent 1px), linear-gradient(90deg, #27272a 1px, transparent 1px)",
                backgroundSize: "48px 48px",
                opacity: 0.4,
                maskImage:
                  "radial-gradient(circle at center, black 30%, transparent 80%)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, black 30%, transparent 80%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{ position: "relative", maxWidth: 1100, margin: "0 auto" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                  gap: 64,
                  alignItems: "center",
                }}
                className="theme-pair-grid"
              >
                <div className={heroFadeClass}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 10px 4px 6px",
                      backgroundColor: "#27272a",
                      border: "1px solid #3f3f46",
                      borderRadius: 9999,
                      marginBottom: 24,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        backgroundColor: "#3f3f46",
                        color: "#e8e8e8",
                        padding: "2px 8px",
                        borderRadius: 9999,
                      }}
                    ></span>
                    <span style={{ fontSize: 12, color: "#9a9a9a" }}>
                      Brand Style Specification
                    </span>
                  </div>

                  <h1
                    style={{
                      fontSize: 56,
                      fontWeight: 600,
                      color: "#e8e8e8",
                      lineHeight: 1.05,
                      letterSpacing: "-0.02em",
                      margin: "0 0 24px",
                      maxWidth: 520,
                    }}
                  >
                    Institutional-grade,{" "}
                    <span style={{ color: "#9a9a9a" }}>
                      without being cold.
                    </span>
                  </h1>
                  <p
                    style={{
                      fontSize: 16,
                      color: "#9a9a9a",
                      lineHeight: 1.6,
                      margin: "0 0 32px",
                      maxWidth: 480,
                    }}
                  >
                    The University Modular Timetable &amp; Analytics System runs
                    on a strictly monochrome design language. No hue-based
                    accents. Hierarchy through tone, weight and spacing alone.
                  </p>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <a
                      href="#colours"
                      style={{
                        height: 40,
                        padding: "0 18px",
                        borderRadius: 8,
                        backgroundColor: "#e8e8e8",
                        color: "#09090b",
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      Explore the system
                      <ChevronRight size={14} />
                    </a>
                    <a
                      href="#components"
                      style={{
                        height: 40,
                        padding: "0 18px",
                        borderRadius: 8,
                        backgroundColor: "#27272a",
                        color: "#e8e8e8",
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        border: "1px solid #3f3f46",
                      }}
                    >
                      Jump to components
                    </a>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 24,
                      marginTop: 48,
                      paddingTop: 32,
                      borderTop: "1px solid #27272a",
                      maxWidth: 480,
                    }}
                  >
                    {[
                      { value: "16", label: "Design tokens" },
                      { value: "7", label: "Type roles" },
                      { value: "WCAG AA", label: "Compliance" },
                    ].map((s) => (
                      <div key={s.label}>
                        <p
                          style={{
                            fontSize: 24,
                            fontWeight: 600,
                            color: "#e8e8e8",
                            margin: 0,
                            lineHeight: 1.1,
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {s.value}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: "#555555",
                            margin: "6px 0 0",
                          }}
                        >
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={heroFadeClass}
                  style={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: 16,
                    padding: 20,
                    boxShadow:
                      "0 20px 50px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)",
                    animationDelay: "150ms",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                      paddingBottom: 14,
                      borderBottom: "1px solid #27272a",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <CalendarDays size={14} style={{ color: "#9a9a9a" }} />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#e8e8e8",
                        }}
                      >
                        Semester 1 · Week 4
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 9999,
                          backgroundColor: "#86efac",
                          display: "inline-block",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: "#9a9a9a",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Live preview
                      </span>
                    </div>
                  </div>
                  <HeroScheduleGrid reducedMotion={reducedMotion} />
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 14,
                      borderTop: "1px solid #27272a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#555555" }}>
                      Weekly Schedule Grid component
                    </span>
                    <a
                      href="#components"
                      style={{
                        fontSize: 11,
                        color: "#9a9a9a",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      Spec
                      <ArrowUpRight size={11} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <ColoursSection />
          <TypographySection />
          <SpacingSection />
          <RadiusSection />
          <ShadowsSection />
          <MotionSection reducedMotion={reducedMotion} />
          <IconsSection />
          <ComponentsSection />
          <VoiceToneSection />
          <AccessibilitySection />
          <ResponsiveSection />

          <footer
            style={{
              padding: "48px 32px 64px",
              backgroundColor: "var(--bg-base)",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                maxWidth: 1200,
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 24,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CalendarDays size={12} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    UMTAS Brand Style Specification
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--text-secondary)",
                      margin: "2px 0 0",
                    }}
                  ></p>
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-disabled)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Team Vigil - for Tyto Insights
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
