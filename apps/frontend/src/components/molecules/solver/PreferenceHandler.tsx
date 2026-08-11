/*
Handler function based on a given string returns the UI element we want
- Start time
- small - gaps
- Large - gaps
- day skip
- morning / afternoon
*/

import { Checkbox } from "@/components/atoms/baseShadcn/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { TIMES, DAYS } from "@/components/atoms/builder/TimeSlotSelect";
import { ReactNode } from "react";
const triggerClass =
  "h-8 text-xs bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)]";

function PreferenceContainer({ children }: { children: ReactNode }) {
  return <div className=" flex flex-row ">{children}</div>;
}

interface PreferenceSelectProps<T extends string | number> {
  value: T;
  onChange: (val: T) => void;
  dataArray: T[];
  placeholder?: string;
}

function PreferenceSelect<T extends string | number>({
  value,
  onChange,
  dataArray,
  placeholder,
}: PreferenceSelectProps<T>) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => {
        onChange(v as T);
      }}
    >
      <SelectTrigger
        data-testid="event-TimeStart-Select"
        className={`${triggerClass} w-[84px]`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)] max-h-44">
        {dataArray.map((t) => (
          <SelectItem
            key={String(t)}
            value={String(t)}
            className="text-xs text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
          >
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
interface StartTimePref {
  startTime: string;
  onChange: (val: string) => void;
}

export function StartTimePref({ startTime, onChange }: StartTimePref) {
  <PreferenceContainer>
    <PreferenceSelect
      value={startTime}
      onChange={onChange}
      placeholder="Start Time"
      dataArray={TIMES}
    ></PreferenceSelect>
  </PreferenceContainer>;
}

interface skipDayProps {
  day: string;
  onChange: (val: string) => void;
}

export function skipDayPref({ day, onChange }: skipDayProps) {
  <PreferenceContainer>
    <PreferenceSelect
      value={day}
      onChange={onChange}
      dataArray={DAYS}
      placeholder="Day"
    />
  </PreferenceContainer>;
}
