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

interface prefContainerProp {
  children: React.ReactNode;
}

function PreferenceContainer({ children }: prefContainerProp) {
  return (
    <div className="grid grid-cols-2 w-full h-full justify-items-start items-center gap-5">
      {children}
    </div>
  );
}

interface CheckBoxProps {
  isChecked: boolean;
  setChecked: (val: boolean) => void;
  disabled: boolean;
}
function PrefCheckbox({ isChecked, setChecked, disabled }: CheckBoxProps) {
  return (
    <div className="flex flex-col justify-center ">
      <Checkbox
        disabled={disabled}
        className="size-5 border-white"
        checked={isChecked}
        onCheckedChange={setChecked}
      />
    </div>
  );
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
        className={`${triggerClass} w-50`}
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
  activePreference: boolean;
  setChecked: (val: boolean) => void;
}

export function StartTimePref({
  startTime,
  onChange,
  activePreference,
  setChecked,
}: StartTimePref) {
  return (
    <PreferenceContainer>
      <label className="flex flex-col gap-1.5 w-full">
        <span className="font-medium text-xs text-[var(--text-primary)]">
          Preferred Start Time
        </span>
        <PreferenceSelect
          value={startTime}
          onChange={onChange}
          placeholder="Start Time"
          dataArray={TIMES}
        />
      </label>

      <PrefCheckbox
        disabled={startTime == ""}
        setChecked={setChecked}
        isChecked={activePreference}
      />
    </PreferenceContainer>
  );
}

interface skipDayProps {
  day: string;
  onChange: (val: string) => void;
  activePreference: boolean;
  setChecked: (val: boolean) => void;
}

export function SkipDayPref({
  day,
  onChange,
  activePreference,
  setChecked,
}: skipDayProps) {
  return (
    <PreferenceContainer>
      <label className="flex flex-col gap-1.5 w-full">
        <span className="font-medium text-xs text-[var(--text-primary)]">
          Skip Day
        </span>
        <PreferenceSelect
          value={day}
          onChange={onChange}
          dataArray={DAYS}
          placeholder="Day"
        />
      </label>
      <PrefCheckbox
        disabled={day == ""}
        setChecked={setChecked}
        isChecked={activePreference}
      />
    </PreferenceContainer>
  );
}

interface smallGapsProp {
  activePreference: boolean;
  setChecked: (val: boolean) => void;
}
export function SmallGapsPref({ activePreference, setChecked }: smallGapsProp) {
  return (
    <PreferenceContainer>
      <span className="font-medium text-xs text-[var(--text-primary)]">
        Prefer Smaller Gaps Between Events?
      </span>
      <PrefCheckbox
        disabled={false}
        isChecked={activePreference}
        setChecked={setChecked}
      ></PrefCheckbox>
    </PreferenceContainer>
  );
}
