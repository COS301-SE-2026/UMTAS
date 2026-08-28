import { Input } from "@/components/atoms/baseShadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { useState } from "react";

const startYear = 2026;
const endYear = 2035;

function generateYears() {
  const length = startYear - endYear;
  const years = [startYear];
  for (let i = 0; i < length; i++) {
    years.push(startYear + i);
  }

  return years;
}

export default function CalTemplate() {
  const years = generateYears();

  const [selectedYear, setSelectedYear] = useState(startYear);

  return (
    <div className="h-[80vh] items-center flex flex-col gap-6 w-full px-6">
      <div className="w-full max-w-6xl overflow-auto border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
          Calendar Management
        </h1>
        <p className="text-sm text-[var(--text-secondary)] pl-4 pt-2 pb-2">
          Search and filter courses, degrees and modules.
        </p>
        <div className="flex flex-col md:flex-row gap-4 p-5 border-b border-[var(--border)] items-center justify-between bg-[var(--bg-surface)]">
          <div className="w-full md:max-w-sm flex-1">
            <Input
              id="input-search-courses-degrees-modules"
              placeholder="Search courses, degrees, or module codes/names..."
              value={""}
              onChange={(e) => {}}
              className="w-full bg-[var(--background)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Select value={""} onValueChange={() => {}}>
              <SelectTrigger
                id="select-all-degrees"
                className="w-[180px] bg-[var(--background)]"
              >
                <SelectValue placeholder="Filter Degree" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Degrees</SelectItem>
                {[].map((year, idx) => (
                  <SelectItem key={idx} value={year}>
                    {}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
