"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  ExternalLink,
  MapPin,
  ScanLine,
} from "lucide-react";

import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Separator } from "@/components/atoms/baseShadcn/separator";
import { PageSkeleton } from "@/components/atoms/nav/PageSkeleton";
import Tutorial from "@/components/organisms/nav/Tutorial";
import { useSession } from "@/lib/auth-client";

const steps = [
  {
    target: "#theme-toggle-btn",
    content: "Click here to toggle between light and dark mode.",
  },
  {
    target: "#build-schedule-btn",
    content: "Click here to start building your schedule.",
  },
  {
    target: "#documentation-link",
    content: "Click here to view the UMTAS documentation.",
  },
  {
    target: "#brand-style-link",
    content: "Click here to view the UMTAS brand style guide.",
  },
  {
    target: "#github-link",
    content: "Click here to view the UMTAS GitHub repository.",
  },
  {
    target: "#help-command-palette-btn",
    content: "Click here to access Tutorials/Help Menu/FAQ.",
  },
];

const typeLines = [
  "Build smarter timetables.",
  "Navigate your campus.",
  "Track attendance instantly.",
  "Understand your lectures.",
];

const speed = 55;
const deleteSpeed = 30;
const delayAfterType = 1800;
const pauseAfterDelete = 400;

function TypewriterLine() {
  const [displayText, setDisplayText] = useState("");
  const [lineIndex, setLineIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "deleting">("typing");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMotionPreference = () => {
      setReduceMotion(mediaQuery.matches);
    };

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

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
  }, [displayText, phase, lineIndex, reduceMotion]);

  if (reduceMotion) {
    return (
      <p className="text-lg font-semibold">
        One connected university experience.
      </p>
    );
  }

  return (
    <div className="h-8 flex items-center gap-2 text-lg font-semibold">
      <span>{displayText}</span>
      <span className="border-[var(--text-primary)] border-l-2 h-6 animate-pulse" />
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { isPending } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  function handleBuild() {
    router.push("/builder");
  }

  function handleExplore() {
    document.getElementById("features")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  if (!mounted || isPending) {
    return (
      <div className="bg-[var(--bg-base)] fixed inset-0 z-50 w-full flex items-center justify-center">
        <PageSkeleton rows={3} />
      </div>
    );
  }

  return (
    <main className="bg-[var(--bg-base)] text-[var(--text-primary)] -mt-6 min-h-[60vh] w-full flex flex-col">
      <section className="bg-[var(--bg-elevated)] border-[var(--border)] border-b w-full">
        <div className="max-w-6xl w-full mx-auto px-6 py-12 grid items-center gap-8 lg:grid-cols-2 lg:px-8 lg:py-16 lg:gap-12">
          <div className="flex flex-col items-start gap-6">
            <Badge
              variant="outline"
              className="text-[var(--text-secondary)] border-[var(--border)] w-fit text-xs"
            >
              University Modular Timetable &amp; Analytics System
            </Badge>

            <div className="flex flex-col gap-2">
              <p className="text-[var(--text-secondary)] text-xs">UMTAS</p>
              <h1 className="max-w-2xl text-4xl font-bold lg:text-5xl">
                Your university day, unified.
              </h1>
            </div>

            <p className="text-[var(--text-secondary)] max-w-2xl text-base lg:text-lg">
              Scheduling, campus navigation, attendance and lecture analytics
              brought together in one connected platform for students, lecturers
              and university administrators.
            </p>

            <TypewriterLine />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                id="build-schedule-btn"
                type="button"
                onClick={handleBuild}
                className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
              >
                Build my timetable
                <ArrowRight size={16} strokeWidth={2} />
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleExplore}
                className="bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--bg-surface)]"
              >
                Explore UMTAS
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="bg-[var(--bg-base)] border-[var(--border)] shadow-[var(--shadow)]">
              <CardContent className="p-4 flex items-center gap-4 lg:p-6">
                <div className="bg-[var(--bg-surface)] border-[var(--border)] h-12 min-w-12 w-12 rounded-lg border flex items-center justify-center">
                  <BookOpen size={20} strokeWidth={2} />
                </div>
                <div className="text-[var(--text-secondary)] flex flex-col gap-2">
                  <h2 className="text-[var(--text-primary)] text-base font-semibold">
                    Smart Scheduling
                  </h2>
                  <p className="text-sm">
                    Build personalised university timetables while UMTAS handles
                    clashes, restrictions and scheduling constraints.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-base)] border-[var(--border)] shadow-[var(--shadow)]">
              <CardContent className="p-4 flex items-center gap-4 lg:p-6">
                <div className="bg-[var(--bg-surface)] border-[var(--border)] h-12 min-w-12 w-12 rounded-lg border flex items-center justify-center">
                  <MapPin size={20} strokeWidth={2} />
                </div>
                <div className="text-[var(--text-secondary)] flex flex-col gap-2">
                  <h2 className="text-[var(--text-primary)] text-base font-semibold">
                    Campus Navigation
                  </h2>
                  <p className="text-sm">
                    Navigate between venues using campus routing and understand
                    busy areas through campus heatmaps.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-base)] border-[var(--border)] shadow-[var(--shadow)]">
              <CardContent className="p-4 flex items-center gap-4 lg:p-6">
                <div className="bg-[var(--bg-surface)] border-[var(--border)] h-12 min-w-12 w-12 rounded-lg border flex items-center justify-center">
                  <ScanLine size={20} strokeWidth={2} />
                </div>
                <div className="text-[var(--text-secondary)] flex flex-col gap-2">
                  <h2 className="text-[var(--text-primary)] text-base font-semibold">
                    Smart Attendance
                  </h2>
                  <p className="text-sm">
                    Run lecturer attendance sessions using barcode scanning,
                    camera scanning and NFC technology.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="features" className="w-full py-12 scroll-mt-16">
        <div className="max-w-6xl w-full mx-auto px-6 lg:px-8">
          <div className="text-[var(--text-secondary)] max-w-2xl mb-8 flex flex-col gap-2">
            <p className="text-xs">Platform</p>
            <h2 className="text-[var(--text-primary)] text-2xl font-semibold">
              Built for the university experience.
            </h2>
            <p className="text-base">
              UMTAS connects academic scheduling with the tools students,
              lecturers and administrators use throughout the university day.
            </p>
          </div>

          <div className="grid gap-4 text-[var(--text-secondary)] sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-[var(--bg-surface)] border-[var(--border)] shadow-[var(--shadow)] h-full">
              <CardContent className="p-6 h-full flex flex-col gap-4">
                <div className="bg-[var(--bg-base)] border-[var(--border)] h-12 w-12 rounded-lg border flex items-center justify-center text-[var(--text-primary)]">
                  <BookOpen size={20} strokeWidth={2} />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-[var(--text-primary)] text-lg font-semibold">
                    Smart Scheduling
                  </h3>
                  <p className="text-sm">
                    Build personalised university timetables while UMTAS handles
                    clashes, restrictions and scheduling constraints.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-surface)] border-[var(--border)] shadow-[var(--shadow)] h-full">
              <CardContent className="p-6 h-full flex flex-col gap-4">
                <div className="bg-[var(--bg-base)] border-[var(--border)] h-12 w-12 rounded-lg border flex items-center justify-center text-[var(--text-primary)]">
                  <MapPin size={20} strokeWidth={2} />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-[var(--text-primary)] text-lg font-semibold">
                    Campus Navigation
                  </h3>
                  <p className="text-sm">
                    Navigate between venues using campus routing and understand
                    busy areas through campus heatmaps.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-surface)] border-[var(--border)] shadow-[var(--shadow)] h-full">
              <CardContent className="p-6 h-full flex flex-col gap-4">
                <div className="bg-[var(--bg-base)] border-[var(--border)] h-12 w-12 rounded-lg border flex items-center justify-center text-[var(--text-primary)]">
                  <ScanLine size={20} strokeWidth={2} />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-[var(--text-primary)] text-lg font-semibold">
                    Smart Attendance
                  </h3>
                  <p className="text-sm">
                    Run lecturer attendance sessions using barcode scanning,
                    camera scanning and NFC technology.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-surface)] border-[var(--border)] shadow-[var(--shadow)] h-full">
              <CardContent className="p-6 h-full flex flex-col gap-4">
                <div className="bg-[var(--bg-base)] border-[var(--border)] h-12 w-12 rounded-lg border flex items-center justify-center text-[var(--text-primary)]">
                  <Activity size={20} strokeWidth={2} />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-[var(--text-primary)] text-lg font-semibold">
                    Lecture Watch
                  </h3>
                  <p className="text-sm">
                    Understand classroom participation, movement and attention
                    patterns throughout a lecture.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-surface)] border-[var(--border)] shadow-[var(--shadow)] h-full">
              <CardContent className="p-6 h-full flex flex-col gap-4">
                <div className="bg-[var(--bg-base)] border-[var(--border)] h-12 w-12 rounded-lg border flex items-center justify-center text-[var(--text-primary)]">
                  <CalendarDays size={20} strokeWidth={2} />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-[var(--text-primary)] text-lg font-semibold">
                    Calendar Integration
                  </h3>
                  <p className="text-sm">
                    Export timetables and university events to supported
                    calendar applications.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-surface)] border-[var(--border)] shadow-[var(--shadow)] h-full">
              <CardContent className="p-6 h-full flex flex-col gap-4">
                <div className="bg-[var(--bg-base)] border-[var(--border)] h-12 w-12 rounded-lg border flex items-center justify-center text-[var(--text-primary)]">
                  <Building2 size={20} strokeWidth={2} />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-[var(--text-primary)] text-lg font-semibold">
                    University Management
                  </h3>
                  <p className="text-sm">
                    Manage modules, venues, academic calendars, events and
                    university scheduling information.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-[var(--bg-elevated)] border-[var(--border)] border-y w-full py-12">
        <div className="max-w-6xl w-full mx-auto px-6 flex flex-col items-center text-center lg:px-8">
          <Badge
            variant="outline"
            className="text-[var(--text-secondary)] border-[var(--border)] mb-4 text-xs"
          >
            One connected platform
          </Badge>

          <h2 className="max-w-3xl text-2xl font-semibold">
            From timetable to lecture hall.
          </h2>

          <p className="text-[var(--text-secondary)] max-w-2xl mt-4 text-base">
            Plan your academic day, navigate campus, attend sessions and gain
            useful lecture insights without moving between disconnected systems.
          </p>

          <div className="max-w-4xl w-full mt-8 grid gap-4 text-[var(--text-secondary)] sm:grid-cols-3">
            <div className="bg-[var(--bg-base)] border-[var(--border)] shadow-[var(--shadow)] rounded-lg border p-6">
              <p className="text-[var(--text-primary)] text-lg font-semibold">
                Plan
              </p>
              <p className="mt-2 text-sm">Personalised academic scheduling</p>
            </div>

            <div className="bg-[var(--bg-base)] border-[var(--border)] shadow-[var(--shadow)] rounded-lg border p-6">
              <p className="text-[var(--text-primary)] text-lg font-semibold">
                Attend
              </p>
              <p className="mt-2 text-sm">Navigation and smart attendance</p>
            </div>

            <div className="bg-[var(--bg-base)] border-[var(--border)] shadow-[var(--shadow)] rounded-lg border p-6">
              <p className="text-[var(--text-primary)] text-lg font-semibold">
                Understand
              </p>
              <p className="mt-2 text-sm">Lecture and engagement insights</p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-8">
        <div className="max-w-6xl w-full mx-auto px-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="text-[var(--text-secondary)] flex flex-col gap-2">
            <p className="text-xs">Project resources</p>
            <p className="text-sm">Documentation and project information.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              id="documentation-link"
              href="https://cos301-se-2026.github.io/UMTAS/latest/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--bg-elevated)] rounded-lg border px-4 py-2 flex items-center gap-2 text-sm"
            >
              Documentation
              <ExternalLink size={16} strokeWidth={2} />
            </Link>

            <Link
              id="brand-style-link"
              href="/brand-style"
              className="bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--bg-elevated)] rounded-lg border px-4 py-2 text-sm"
            >
              Brand Style
            </Link>

            <Link
              id="github-link"
              href="https://github.com/COS301-SE-2026/UMTAS"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--bg-elevated)] rounded-lg border px-4 py-2 flex items-center gap-2 text-sm"
            >
              GitHub
              <ExternalLink size={16} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-[var(--border)] border-t w-full">
        <div className="max-w-6xl w-full mx-auto px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex flex-col gap-2">
            <p className="text-base font-semibold">UMTAS</p>
            <p className="text-[var(--text-secondary)] text-xs">
              University Modular Timetable &amp; Analytics System
            </p>
          </div>

          <div className="text-[var(--text-disabled)] flex items-center gap-4 text-xs">
            <p>Team Vigil</p>
            <Separator
              orientation="vertical"
              className="bg-[var(--border)] h-4"
            />
            <p>Built for Tyto Insights</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={3} />}>
      <DashboardContent />
      <Tutorial steps={steps} wait={true} />
    </Suspense>
  );
}
