"use client";

import { Badge } from "@/components/atoms/baseShadcn/badge";
import AttendanceCounter from "./AttendanceCounter";
import { LastScannedStudent } from "./LastScannedStudent";
import { useCallback, useState } from "react";
import BarcodeCamera from "@/components/molecules/attendance/BarcodeCamera";
import { ScannerBadge } from "@/components/molecules/attendance/ScannerBadge";

interface AttendanceScannerProps {
  expectedNumber: number;
}

export default function AttendanceScanner({
  expectedNumber,
}: AttendanceScannerProps) {
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [attended, setAttended] = useState(0);
  const [status, setStatus] = useState<"READY" | "SUCCESS" | "ERROR">("READY");

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
      <div>
        <ScannerBadge status={status} />
      </div>
      <div className="aspect-video w-full rounded-xl border-2">
        {/* update props after done implementing, remember to add handleScan as prop  */}
        <BarcodeCamera />
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
