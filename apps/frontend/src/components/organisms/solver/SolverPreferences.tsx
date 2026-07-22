"use client";

import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/atoms/baseShadcn/card";
import { LucidePlusCircle } from "lucide-react";
import { useState } from "react";
import PreferenceSection from "@/components/molecules/solver/PreferencesCard";
import { useRouter } from "next/navigation";

export default function SolverPreferences() {
  const [iconClicked, setIconClicked] = useState(false);
  const [sections, setSections] = useState([0]);
  const [currentMode, setCurrentMode] = useState("Feasibility");

  const router = useRouter();

  function handleAdd() {
    setSections((prev) => [...prev, Date.now()]);
  }

  function handleDelete(idToDelete: number) {
    setSections((prev) => prev.filter((id) => id !== idToDelete));
  }

  function solveMode(mode: string) {
    if (mode === "Feasibility") {
      return <></>;
    }

    return (
      <>
        {" "}
        <div className="space-y-4">
          <div className="flex flex-row items-center justify-between">
            <strong>Preferences</strong>
            <LucidePlusCircle
              strokeWidth={iconClicked ? 1.8 : 1.1}
              onClick={() => {
                handleAdd();
                setIconClicked(true);
                setTimeout(() => setIconClicked(false), 150);
              }}
              className="transition-all duration-150 cursor-pointer"
            />
          </div>
          {sections.map((id) => (
            <PreferenceSection
              key={id}
              DropdownItems={[
                "Prefer mornings",
                "Prefer evenings",
                "Prefer large gaps",
              ]}
              onDelete={() => {
                handleDelete(id);
              }}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Card className="shadow-lg border-[var(--border)] rounded-xl bg-[var(--bg-surface)] w-md">
        <CardHeader className="text-xl font-bold text-[var(--text-primary)]">
          Set your preferences
        </CardHeader>
        <CardDescription className="px-4">
          These are soft preferences. They shape which timetable is picked,
          never making a timetable invalid
        </CardDescription>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <strong>
              <p>Solve mode</p>
            </strong>
            <div className="flex flex-row gap-4">
              {" "}
              <Button
                variant={"outline"}
                onClick={() => {
                  setCurrentMode("Feasibility");
                }}
              >
                Feasibility
              </Button>
              <Button
                variant={"outline"}
                onClick={() => {
                  setCurrentMode("Optimisation");
                }}
              >
                Optimisation
              </Button>
              <Button>upload and create timetable</Button>
            </div>
          </div>
          {solveMode(currentMode)}
          <Button
            type="button"
            onClick={() => {
              router.push("/schedules");
            }}
          >
            View Timetable
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
