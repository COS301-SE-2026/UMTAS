"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";

interface StudentNumberInputProps {
  onScan: (studentNumber: string) => void;
}

export function StudentNumberInput({ onScan }: StudentNumberInputProps) {
  const [studentNumber, setStudentNumber] = useState("");

  const handleSubmit = () => {
    const value = studentNumber.trim();

    if (!/^\d{7}$/.test(value)) {
      return;
    }

    onScan(value);
    setStudentNumber("");
  };

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-xl border-2 p-6">
      <div className="text-center">
        <p className="text-lg font-medium text-[var(--text-primary)]">
          Scanner / Manual Entry
        </p>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Scan a student card or enter the student number manually
        </p>
      </div>

      <div className="flex w-full max-w-sm gap-2">
        <Input
          autoFocus
          value={studentNumber}
          onChange={(event) => {
            setStudentNumber(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSubmit();
            }
          }}
          placeholder="Student number"
          inputMode="numeric"
          maxLength={7}
        />

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!/^\d{7}$/.test(studentNumber)}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
