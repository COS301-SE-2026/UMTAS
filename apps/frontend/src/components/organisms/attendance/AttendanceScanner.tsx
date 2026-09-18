"use client";

import AttendanceCounter from "./AttendanceCounter";
import { LastScannedStudent } from "./LastScannedStudent";
import { useCallback, useState } from "react";
import { BarcodeCamera } from "@/components/molecules/attendance/BarcodeCamera";
import { ScannerBadge } from "@/components/molecules/attendance/ScannerBadge";
import { StudentNumberInput } from "@/components/molecules/attendance/USBBarcodeScanner";
import { Switch } from "@/components/atoms/baseShadcn/switch";
import { Label } from "@/components/atoms/baseShadcn/label";

interface AttendanceScannerProps {
  expectedNumber: number;
}

export default function AttendanceScanner({
  expectedNumber,
}: AttendanceScannerProps) {
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [attended, setAttended] = useState(0);
  const [status, setStatus] = useState<"READY" | "SUCCESS" | "ERROR">("READY");
  const [useCamera, setUseCamera] = useState(true);

  const handleScan = useCallback((studentNumber: string) => {
    setLastScan(studentNumber);
    setAttended((current) => current + 1);
    setStatus("SUCCESS");

    window.setTimeout(() => {
      setStatus("READY");
    }, 1500);
  }, []);

  return (
    <>
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
          numberAttended={attended}
          numberExpected={expectedNumber}
        />
      </div>

      <div className="w-full pb-8">
        <LastScannedStudent studentNumber={lastScan} />
      </div>
    </>
  );
}
