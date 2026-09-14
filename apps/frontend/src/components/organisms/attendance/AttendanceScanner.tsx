"use client";

import { useCallback, useState } from "react";

import { BarcodeCamera } from "@/components/molecules/attendance/BarcodeCamera";
import { AttendanceCounter } from "@/components/molecules/attendance/AttendanceCounter";
import { ScannerStatusBadge } from "@/components/atoms/attendance/ScannerStatusBadge";

export function AttendanceScanner() {
  const [lastScan, setLastScan] = useState<string | null>(null);

  const [attended, setAttended] = useState(0);

  const [status, setStatus] = useState<"ready" | "success" | "error">("ready");

  const handleScan = useCallback((value: string) => {
    setLastScan(value);
    setAttended((current) => current + 1);
    setStatus("success");

    window.setTimeout(() => {
      setStatus("ready");
    }, 1500);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <ScannerStatusBadge status={status} />
      </div>

      <BarcodeCamera onScan={handleScan} />

      {lastScan && (
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground">Last scanned</p>

          <p className="font-mono text-xl font-semibold">{lastScan}</p>
        </div>
      )}

      <AttendanceCounter attended={attended} expected={100} />
    </div>
  );
}
