"use client";

import { Button } from "@/components/atoms/baseShadcn/button";
import { Card } from "@/components/atoms/baseShadcn/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/baseShadcn/dropdown-menu";
import { Slider } from "@/components/atoms/baseShadcn/slider";
import { Trash } from "lucide-react";

interface PreferencesCardProps {
  DropdownItems: string[];
  sliderValue: number[];
  setSliderValue: (val: number[]) => void;
  onDelete: () => void;
}

export default function PreferencesCard({
  DropdownItems,
  onDelete,
  sliderValue,
  setSliderValue,
}: PreferencesCardProps) {
  return (
    <Card className="flex flex-row px-2 items-center w-sm">
      <div className="flex flex-row items-center justify-between p-1 w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Select Preference</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {DropdownItems.map((Item) => {
              return <DropdownMenuItem key={Item}>{Item}</DropdownMenuItem>;
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="w-32 flex items-center relative">
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            max={24}
            step={1}
          />
          <span className="font-medium text-[var(--text-secondary)] pl-4">
            {sliderValue[0]}
          </span>
        </div>
        <Button variant={"outline"} className="w-fit" onClick={onDelete}>
          <Trash />
        </Button>
      </div>
    </Card>
  );
}
