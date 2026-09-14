"use client";

import { useCallback, useState } from "react";

import { BarcodeCamera } from "@/components/molecules/attendance/BarcodeCamera";
import { LastScannedStudent } from "@/components/molecules/attendance/LastScannedStudent";

export function AttendanceScanner() {
  const [studentNumber, setStudentNumber] = useState<string | null>(null);

  const handleScan = useCallback((value: string) => {
    if (!/^\d{7}$/.test(value)) {
      return;
    }

    setStudentNumber(value);

    console.log("Student scanned:", value);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <BarcodeCamera onScan={handleScan} />

      <LastScannedStudent studentNumber={studentNumber} />
    </div>
  );
}
