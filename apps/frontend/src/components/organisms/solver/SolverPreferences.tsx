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
import { Trash } from "lucide-react";
import { Slider } from "@/components/atoms/baseShadcn/slider";
import { useState } from "react";

export default function SolverPreferences() {
  const [sliderValue, setSliderValue] = useState([0]);

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
            <strong>Preferences</strong>
            <Card className="flex flex-row px-2 items-center w-sm">
              <div className="flex flex-row items-center justify-between p-1 w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Select Preference</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Morning Classes</DropdownMenuItem>
                    <DropdownMenuItem>No Friday Slots</DropdownMenuItem>
                    <DropdownMenuItem>Grouped Modules</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="w-32 flex items-center relative">
                  <Slider
                    value={sliderValue}
                    onValueChange={setSliderValue}
                    max={5}
                    step={1}
                  />
                  <span className="font-medium text-[var(--text-secondary)] pl-4">
                    {sliderValue[0]}
                  </span>
                </div>
                <Button variant={"outline"} className="w-fit">
                  <Trash />
                </Button>
              </div>
            </Card>
            <Card className="flex flex-row px-2 items-center w-sm">
              <div className="flex flex-row items-center justify-between p-1 w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Select Preference</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Morning Classes</DropdownMenuItem>
                    <DropdownMenuItem>No Friday Slots</DropdownMenuItem>
                    <DropdownMenuItem>Grouped Modules</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="w-32 flex items-center relative">
                  <Slider
                    value={sliderValue}
                    onValueChange={setSliderValue}
                    max={5}
                    step={1}
                  />
                  <span className="font-medium text-[var(--text-secondary)] pl-4">
                    {sliderValue[0]}
                  </span>
                </div>
                <Button variant={"outline"} className="w-fit">
                  <Trash />
                </Button>
              </div>
            </Card>
          </div>
          <Button type="button">View Timetable</Button>
        </CardContent>
      </Card>
    </>
  );
}
