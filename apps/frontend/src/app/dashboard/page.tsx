"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  SlidersHorizontal,
  Download,
  ExternalLink,
} from "lucide-react";
import { useSession } from "@/../utilities/auth-client";
import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { Separator } from "@/components/atoms/baseShadcn/separator";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { Button } from "@/components/atoms/baseShadcn/button";
import { PageSkeleton } from "@/components/atoms/nav/PageSkeleton";
import Link from "next/link";

const Features = [
  {
    icon: BookOpen,
    title: "Build",
    description: "Add your modules and events. UMTAS handles the rest.",
  },
  {
    icon: SlidersHorizontal,
    title: "Schedules",
    description: "View your created timetables.",
  },
  {
    icon: Download,
    title: "Export",
    description: "One click to .ics. Works with Google Calendar.",
  },
];

const Links = [
  { label: "Documentation", href: "https://cos301-se-2026.github.io/UMTAS/" },
  { label: "Brand Style", href: "https://brand.capstone-vigil.dns.net.za/" },
  { label: "GitHub", href: "https://github.com/COS301-SE-2026/UMTAS" },
];

const typeLines = [
  "3 steps to a schedule.",
  ".ics one-click export.",
  "0 scheduling conflicts.",
];

const speed = 55;
const deleteSpeed = 30;
const delayAfterType = 1800;
const pauseAfterDelete = 400;

function TypewriterLine() {
  const [displayText, setDisplayText] = useState("");
  const [lineIndex, setLineIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "deleting">("typing");

  useEffect(() => {
    const currentLine = typeLines[lineIndex];

    if (phase === "typing") {
      if (displayText.length < currentLine.length) {
        const timeout = setTimeout(() => {
          setDisplayText(currentLine.slice(0, displayText.length + 1));
        }, speed);
        return () => clearTimeout(timeout);
      }
      const timeout = setTimeout(() => {
        setPhase("deleting");
      }, delayAfterType);
      return () => clearTimeout(timeout);
    }

    if (phase === "deleting") {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, displayText.length - 1));
        }, deleteSpeed);
        return () => clearTimeout(timeout);
      }
      const timeout = setTimeout(() => {
        setLineIndex((prev) => (prev + 1) % typeLines.length);
        setPhase("typing");
      }, pauseAfterDelete);
      return () => clearTimeout(timeout);
    }
  }, [displayText, phase, lineIndex]);

  return (
    <div className="flex items-center gap-1 h-10">
      <span className="text-2xl font-semibold text-[var(--text-primary)] leading-none">
        {displayText}
      </span>
      <span className="inline-block w-0.5 h-7 bg-[var(--text-primary)] animate-pulse" />
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const userName = session?.user?.name ?? null;

  function handleBuild() {
    router.push("/builder");
  }

  function renderGreeting() {
    if (userName) {
      return "Welcome back, " + userName.split(" ")[0] + ".";
    }
    return "Welcome to UMTAS.";
  }

  return (
    <div className="flex flex-col w-full">
      {/* hero */}
      <div className="w-full bg-[var(--bg-elevated)] border-b border-[var(--border)] py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* left */}
          <div className="flex flex-col gap-5">
            <Badge
              variant="outline"
              className="w-fit text-[10px] uppercase tracking-[0.06em] border-[var(--border)] text-[var(--text-secondary)]"
            >
              University Modular Timetable &amp; Analytics System
            </Badge>

            <h1 className="text-4xl lg:text-5xl font-semibold text-[var(--text-primary)] leading-[1.1] suppressHydrationWarning">
              {renderGreeting()}
            </h1>

            <p className="text-base lg:text-lg text-[var(--text-secondary)] leading-relaxed max-w-sm">
              Build your personal university timetable in minutes.
            </p>

            <TypewriterLine />

            <div className="pt-1">
              <Button
                type="button"
                onClick={handleBuild}
                size="default"
                className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors duration-[var(--duration-fast)]"
              >
                Build a schedule
              </Button>
            </div>
          </div>

          {/* right */}
          <div className="flex flex-col gap-3">
            {Features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="border-[var(--border)] bg-[var(--bg-base)] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
                >
                  <CardContent className="p-4 lg:p-5 flex items-center gap-4">
                    <div className="flex h-10 w-10 lg:h-12 lg:w-12 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]">
                      <Icon
                        size={20}
                        strokeWidth={1.5}
                        className="text-[var(--text-primary)]"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-lg font-semibold text-[var(--text-primary)]">
                        {feature.title}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* links */}
      <div className="w-full py-10 bg-[var(--bg-base)]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)] mb-5">
            Resources
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-4 text-sm font-medium text-[var(--text-primary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--bg-elevated)]"
              >
                {link.label}
                <ExternalLink
                  size={14}
                  strokeWidth={1.5}
                  className="text-[var(--text-secondary)] flex-shrink-0"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* bottom stuffies */}
      <div className="py-4 bg-[var(--bg-base)] border-t border-[var(--border)] w-full">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <p className="text-[10px] lg:text-xs uppercase tracking-[0.06em] text-[var(--text-disabled)] font-medium">
            Demo 1 - Team Vigil
          </p>
          <Separator
            orientation="vertical"
            className="h-4 bg-[var(--border)]"
          />
          <p className="text-[10px] lg:text-xs uppercase tracking-[0.06em] text-[var(--text-disabled)] font-medium">
            Built for Tyto Insights
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={3} />}>
      <DashboardContent />
    </Suspense>
  );
}
