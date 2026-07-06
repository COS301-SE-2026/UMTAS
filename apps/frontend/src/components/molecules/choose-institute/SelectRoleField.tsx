"use client";

import { Label } from "@/components/atoms/baseShadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { uniDtoRoles } from "@/components/templates/choose-institute/queries/builders";

const roles: uniDtoRoles[] = ["LECTURER", "STUDENT", "UNIVERSITY_ADMIN"];

interface SelectRoleFieldProps {
  value: string; //todo: adjust when willie tells me to
  onChange: (value: string) => void;
}

export function SelectRoleField({ value, onChange }: SelectRoleFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="role-select">Select Role</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="role-select" className="w-full">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role} value={role || ""}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
