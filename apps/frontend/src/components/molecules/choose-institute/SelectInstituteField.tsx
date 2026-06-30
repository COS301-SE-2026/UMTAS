"use client";

import { Label } from "@/components/atoms/baseShadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { NotSupportedLink } from "@/components/atoms/choose-institute/NotSupportedLink";

interface Institute {
  id: string;
  name: string;
}

interface SelectInstituteFieldProps {
  institutes: Institute[];
  value: string;
  onChange: (value: string) => void;
  onNotSupportedClick: () => void;
}

export function SelectInstituteField({
  institutes,
  value,
  onChange,
  onNotSupportedClick,
}: SelectInstituteFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="institute-select">Select Institute</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="institute-select">
          <SelectValue placeholder="Select an institute" />
        </SelectTrigger>
        <SelectContent>
          {institutes.map((institute) => (
            <SelectItem key={institute.id} value={institute.id}>
              {institute.name}
            </SelectItem>
          ))}
        </SelectContent>
        <NotSupportedLink onClick={onNotSupportedClick} />
      </Select>
    </div>
  );
}
