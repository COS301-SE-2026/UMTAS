"use client";

import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/atoms/baseShadcn/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/baseShadcn/dropdown-menu";
import { Trash, LucidePlusCircle } from "lucide-react";
import { Slider } from "@/components/atoms/baseShadcn/slider";
import { useState } from "react";
import PreferenceSection from "@/components/molecules/solver/PreferencesCard";

export default function SolverPreferences() {
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
              <Button variant={"outline"}>Feasibility</Button>
              <Button variant={"outline"}>Optimisation</Button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex flex-row items-center justify-between">
              <strong>Preferences</strong>
              <LucidePlusCircle strokeWidth={1.1} />
            </div>
            <PreferenceSection
              DropdownItems={[
                "Prefer mornings",
                "Prefer evenings",
                "Prefer large gaps",
              ]}
            />
          </div>
          <Button type="button">View Timetable</Button>
        </CardContent>
      </Card>
    </>
  );
}
