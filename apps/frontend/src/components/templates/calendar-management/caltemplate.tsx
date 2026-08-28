"use client";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import CalCard from "@/components/organisms/Calandar-management/temporary-card";

import { useState } from "react";

const startYear = 2026;
const endYear = 2035;

function generateYears() {
  const length = startYear - endYear;
  const years = [String(startYear)];
  for (let i = 0; i < length; i++) {
    years.push(String(startYear + i));
  }

  return years;
}

export default function CalTemplate() {
  const years = generateYears();

  const [selectedYear, setSelectedYear] = useState(String(startYear));

  return (
    <div className="h-[80vh] items-center flex flex-col gap-6 w-full px-6">
      <div className="w-full p-2 h-full max-w-6xl overflow-auto border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
          Calendar Management
        </h1>
        <p className="text-sm text-[var(--text-secondary)] pl-4 pt-2 pb-2">
          Update and manage calendars by year
        </p>
        <div className="flex flex-col md:flex-row gap-4 p-5 border-b border-[var(--border)] items-center justify-between bg-[var(--bg-surface)]">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Select
              value={selectedYear}
              onValueChange={(e) => {
                setSelectedYear(e);
              }}
            >
              <SelectTrigger
                id="select-all-degrees"
                className="w-[180px] bg-[var(--background)]"
              >
                <SelectValue placeholder="Filter Degree" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Degrees</SelectItem>
                {years.map((year, idx) => (
                  <SelectItem key={idx} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button>create restriction</Button>
          </div>
        </div>
        <div className="w-full border-dashed border-5  flex flex-col items-center p-5 h-1/4">
          <CalCard></CalCard>
        </div>
        <div className="w-full  flex flex-col items-center p-5 h-3/4 gap-y-5">
          <CalCard></CalCard>
          <CalCard></CalCard>
          <CalCard></CalCard>
        </div>
      </div>
    </div>
  );
}
