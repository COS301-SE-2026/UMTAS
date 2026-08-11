/*
Handler function based on a given string returns the UI element we want
- Start time
- small - gaps
- Large - gaps
- day skip
- morning / afternoon
*/

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { TIMES, DAYS } from "@/components/atoms/builder/TimeSlotSelect";
const triggerClass =
  "h-8 text-xs bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)]";

interface StartTimeHeuristicPref {
  startTime: string;
  onChange: (val: string) => void;
}

export function StartTimePref({ startTime, onChange }: StartTimeHeuristicPref) {
  <div>
    <Select value={startTime} onValueChange={(v) => onChange(v)}>
      <SelectTrigger
        data-testid="event-TimeStart-Select"
        className={`${triggerClass} w-[84px]`}
      >
        <SelectValue placeholder="Start" />
      </SelectTrigger>
      <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)] max-h-44">
        {TIMES.map((t) => (
          <SelectItem
            key={t}
            value={t}
            className="text-xs text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
          >
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>;
}

interface skipDayProps {
  day: string;
  onChange: (val: string) => void;
}

export function skipDayPref({ day, onChange }: skipDayProps) {
  <div>
    <Select value={day} onValueChange={(v) => onChange(v)}>
      <SelectTrigger
        data-testid="event-TimeStart-Select"
        className={`${triggerClass} w-[84px]`}
      >
        <SelectValue placeholder="Start" />
      </SelectTrigger>
      <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)] max-h-44">
        {DAYS.map((t) => (
          <SelectItem
            key={t}
            value={t}
            className="text-xs text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
          >
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>;
}
