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
import { uniDto } from "@/components/templates/choose-institute/queries/builders";

interface SelectInstituteFieldProps {
  institutes: uniDto[];
  value: string;
  onChange: (id: string) => void;
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
      <Label htmlFor="institute-select">Select Institute</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="institute-select" className="w-full">
          <SelectValue placeholder="Select an institute" />
        </SelectTrigger>
        <SelectContent>
          {institutes.map((institute) => (
            <SelectItem
              key={institute.UniversityID}
              value={institute.UniversityID}
            >
              {institute.UniversityName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex justify-center w-full">
        {" "}
        <NotSupportedLink onClick={onNotSupportedClick} />
      </div>
    </div>
  );
}
