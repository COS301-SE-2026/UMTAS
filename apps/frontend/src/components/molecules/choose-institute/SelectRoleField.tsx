"use client";

import { Label } from "@/components/atoms/baseShadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";

const roles = ["LECTURER", "STUDENT", "UNIVERSITY_ADMIN"] as const;

interface SelectRoleFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function SelectRoleField({ value, onChange }: SelectRoleFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="role-select">Select Role</Label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="role-select" className="w-full">
          <SelectValue placeholder="Select a Role" />
        </SelectTrigger>

        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role} value={role}>
              {role
                .toLowerCase()
                .replaceAll("_", " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
