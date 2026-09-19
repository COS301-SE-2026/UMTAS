"use client";

import AttendanceCounter from "./AttendanceCounter";
import { LastScannedStudent } from "./LastScannedStudent";

import { ChangeEvent, useCallback, useState } from "react";

import { BarcodeCamera } from "@/components/molecules/attendance/BarcodeCamera";
import { ScannerBadge } from "@/components/molecules/attendance/ScannerBadge";
import { StudentNumberInput } from "@/components/molecules/attendance/USBBarcodeScanner";

import { Switch } from "@/components/atoms/baseShadcn/switch";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Button } from "@/components/atoms/baseShadcn/button";

export default function AttendanceScanner() {
  const [expectedStudents, setExpectedStudents] = useState<string[]>([]);
  const [attendedStudents, setAttendedStudents] = useState<Set<string>>(
    new Set(),
  );

  const [fileName, setFileName] = useState<string | null>(null);

  const [lastScan, setLastScan] = useState<string | null>(null);

  const [status, setStatus] = useState<"READY" | "SUCCESS" | "ERROR">("READY");

  const [useCamera, setUseCamera] = useState(true);

  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const text = await file.text();

    //Extract every unique 8 digit student number from the file
    const studentNumbers = text.match(/\b\d{8}\b/g) ?? [];

    const uniqueStudentNumbers = [...new Set(studentNumbers)];

    setExpectedStudents(uniqueStudentNumbers);
    setFileName(file.name);

    setAttendedStudents(new Set());
    setLastScan(null);
    setSessionStarted(false);
    setSessionEnded(false);
    setStatus("READY");
  };

  const handleScan = useCallback(
    (studentNumber: string) => {
      if (!sessionStarted || sessionEnded) return;

      const cleanedStudentNumber = studentNumber.trim();

      setLastScan(cleanedStudentNumber);

      if (!/^\d{8}$/.test(cleanedStudentNumber)) {
        setStatus("ERROR");

        window.setTimeout(() => {
          setStatus("READY");
        }, 1500);

        return;
      }

      if (!expectedStudents.includes(cleanedStudentNumber)) {
        setStatus("ERROR");

        window.setTimeout(() => {
          setStatus("READY");
        }, 1500);

        return;
      }

      setAttendedStudents((current) => {
        if (current.has(cleanedStudentNumber)) {
          return current;
        }

        const updated = new Set(current);

        updated.add(cleanedStudentNumber);

        return updated;
      });

      setStatus("SUCCESS");

      window.setTimeout(() => {
        setStatus("READY");
      }, 1500);
    },
    [expectedStudents, sessionEnded, sessionStarted],
  );

  const startSession = () => {
    if (expectedStudents.length === 0) return;

    setAttendedStudents(new Set());
    setLastScan(null);
    setSessionEnded(false);
    setSessionStarted(true);
    setStatus("READY");
  };

  const endSession = () => {
    setSessionStarted(false);
    setSessionEnded(true);
    setStatus("READY");
  };

  const resetSession = () => {
    setExpectedStudents([]);
    setAttendedStudents(new Set());
    setFileName(null);
    setLastScan(null);
    setSessionStarted(false);
    setSessionEnded(false);
    setStatus("READY");
  };

  if (sessionEnded) {
    return (
      <div className="flex w-full flex-col items-center gap-6 py-10 text-center">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            Session Complete
          </p>

          <p className="mt-2 text-4xl font-semibold text-[var(--text-primary)]">
            {attendedStudents.size} / {expectedStudents.length}
          </p>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            students attended
          </p>
        </div>

        <Button type="button" onClick={resetSession}>
          New Session
        </Button>
      </div>
    );
  }

  if (!sessionStarted) {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="font-medium text-[var(--text-primary)]">
            Upload Student List
          </p>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Upload a CSV, TXT, or MD file containing 8 digit student numbers.
          </p>

          <input
            type="file"
            accept=".csv,.txt,.md,text/csv,text/plain,text/markdown"
            onChange={handleFileUpload}
            className="mt-4 block w-full text-sm text-[var(--text-secondary)]"
          />
        </div>

        {fileName && (
          <div className="rounded-lg border border-[var(--border)] p-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {fileName}
            </p>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {expectedStudents.length} students found
            </p>
          </div>
        )}

        <Button
          type="button"
          disabled={expectedStudents.length === 0}
          onClick={startSession}
          className="w-full"
        >
          Start Attendance Session
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <ScannerBadge status={status} />

        <div className="flex items-center gap-2">
          <Label
            htmlFor="scanner-mode"
            className="text-sm text-[var(--text-secondary)]"
          >
            Scanner / Manual
          </Label>

          <Switch
            id="scanner-mode"
            checked={useCamera}
            onCheckedChange={setUseCamera}
          />

          <Label
            htmlFor="scanner-mode"
            className="text-sm text-[var(--text-secondary)]"
          >
            Camera
          </Label>
        </div>
      </div>

      <div className="w-full">
        {useCamera ? (
          <div className="aspect-video w-full rounded-xl border-2">
            <BarcodeCamera onScan={handleScan} />
          </div>
        ) : (
          <StudentNumberInput onScan={handleScan} />
        )}
      </div>

      <div className="w-full">
        <AttendanceCounter
          numberAttended={attendedStudents.size}
          numberExpected={expectedStudents.length}
        />
      </div>

      <div className="w-full">
        <LastScannedStudent studentNumber={lastScan} />
      </div>

      <Button type="button" onClick={endSession} className="w-full">
        End Attendance Session
      </Button>
    </div>
  );
}
