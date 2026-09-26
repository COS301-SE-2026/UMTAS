"use client";

import AttendanceCounter from "./AttendanceCounter";
import { LastScannedStudent } from "./LastScannedStudent";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Upload } from "lucide-react";

import { BarcodeCamera } from "@/components/molecules/attendance/BarcodeCamera";
import { ScannerBadge } from "@/components/molecules/attendance/ScannerBadge";
import { StudentNumberInput } from "@/components/molecules/attendance/USBBarcodeScanner";

import {
  getAttendanceSlotsQ,
  updateAttendanceCountMut,
} from "@/components/templates/attendance/Queries/attendanceQueries";
import { ConflictingEventDialog } from "./ConflictingEventDialog";
import { selectPreferredEvent } from "@/lib/nfc_attendance/nfc_api";
import type { AttendanceSlot } from "@/lib/nfc_attendance/types";

import { Switch } from "@/components/atoms/baseShadcn/switch";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Button } from "@/components/atoms/baseShadcn/button";

export default function AttendanceScanner() {
  const pendingScans = useRef(new Set<string>());
  const recordedScans = useRef(new Set<string>());
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

  const [conflictOpen, setConflictOpen] = useState(false);
  const [selectingSlot, setSelectingSlot] = useState(false);

  const {
    data: fetchedSlotData,
    isLoading: slotsLoading,
    isFetchedAfterMount,
    refetch,
  } = useQuery(getAttendanceSlotsQ());
  const slotData = isFetchedAfterMount ? fetchedSlotData : undefined;
  const slots: AttendanceSlot[] = (slotData?.slotList ?? []).map((slot) => ({
    id: `${slot.eventID}:${slot.scheduledStartAt}`,
    eventID: slot.eventID,
    scheduledStartAt: slot.scheduledStartAt,
    sessionId: slot.sessionId,
    moduleCode: slot.moduleCode,
    moduleName: slot.moduleName,
    venue: slot.venue ?? "Venue not set",
    startAt: slot.scheduledStartAt,
    endAt: slot.scheduledEndAt,
    state: slot.state,
    attendanceCount: slot.attendanceCount,
  }));
  const currentSlot = slotData?.currentSlot
    ? (slots.find(
        (slot) =>
          slot.eventID === slotData.currentSlot?.eventID &&
          slot.scheduledStartAt === slotData.currentSlot.scheduledStartAt,
      ) ?? null)
    : null;
  const selectedSlot = currentSlot;
  const selectedEventID = selectedSlot?.eventID ?? "";
  const { mutateAsync: updateAttendanceCount } = useMutation(
    updateAttendanceCountMut(),
  );

  useEffect(() => {
    if (!selectedEventID) return;
    let cancelled = false;
    const key = `attendance-scanner:${selectedEventID}`;
    const saved = window.sessionStorage.getItem(key);
    if (saved) {
      try {
        const state = JSON.parse(saved) as {
          expected: string[];
          scanned: string[];
          fileName: string;
          active: boolean;
        };
        queueMicrotask(() => {
          if (cancelled) return;
          setExpectedStudents(state.expected);
          recordedScans.current = new Set(state.scanned ?? []);
          setAttendedStudents(new Set(recordedScans.current));
          setFileName(state.fileName);
          setSessionStarted(state.active);
        });
      } catch {
        window.sessionStorage.removeItem(key);
      }
    }
    return () => {
      cancelled = true;
    };
  }, [selectedEventID]);

  useEffect(() => {
    if (!selectedEventID || !fileName) return;
    window.sessionStorage.setItem(
      `attendance-scanner:${selectedEventID}`,
      JSON.stringify({
        expected: expectedStudents,
        scanned: [...attendedStudents],
        fileName,
        active: sessionStarted,
      }),
    );
  }, [
    selectedEventID,
    expectedStudents,
    attendedStudents,
    fileName,
    sessionStarted,
  ]);

  const resetUploadedList = () => {
    if (selectedEventID)
      window.sessionStorage.removeItem(`attendance-scanner:${selectedEventID}`);
    setExpectedStudents([]);
    recordedScans.current = new Set();
    setAttendedStudents(new Set());
    setFileName(null);
    setLastScan(null);
  };

  const handleSlotSelect = async (slot: AttendanceSlot) => {
    setSelectingSlot(true);
    try {
      await selectPreferredEvent(slot);
      resetUploadedList();
      setConflictOpen(false);
      await refetch();
    } catch {
      setConflictOpen(true);
    } finally {
      setSelectingSlot(false);
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !selectedEventID) return;

    const text = await file.text();

    const studentNumbers = text.match(/\b\d{8}\b/g) ?? [];
    const uniqueStudentNumbers = [...new Set(studentNumbers)];

    setExpectedStudents(uniqueStudentNumbers);
    setFileName(file.name);

    setLastScan(null);

    setSessionStarted(false);
    setSessionEnded(false);

    setStatus("READY");
  };

  const handleScan = async (studentNumber: string) => {
    if (!sessionStarted || sessionEnded || !selectedEventID) {
      return;
    }

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

    if (pendingScans.current.has(cleanedStudentNumber)) return;
    pendingScans.current.add(cleanedStudentNumber);
    if (!recordedScans.current.has(cleanedStudentNumber)) {
      recordedScans.current.add(cleanedStudentNumber);
      setAttendedStudents(new Set(recordedScans.current));
    }
    try {
      await updateAttendanceCount({
        guestCount: recordedScans.current.size,
        eventID: selectedEventID,
      });
      setStatus("SUCCESS");
      void refetch();
    } catch {
      setStatus("ERROR");
    } finally {
      pendingScans.current.delete(cleanedStudentNumber);
    }

    window.setTimeout(() => {
      setStatus("READY");
    }, 1500);
  };

  const startSession = () => {
    if (expectedStudents.length === 0 || !selectedEventID) {
      return;
    }

    setAttendedStudents(new Set(recordedScans.current));
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
    if (selectedEventID)
      window.sessionStorage.removeItem(`attendance-scanner:${selectedEventID}`);
    setExpectedStudents([]);
    setAttendedStudents(new Set(recordedScans.current));

    setFileName(null);
    setLastScan(null);

    setSessionStarted(false);
    setSessionEnded(false);

    setStatus("READY");
  };

  if (sessionEnded) {
    return (
      <div className="flex min-h-[650px] w-full flex-col items-center justify-center gap-6 text-center">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Completed</p>

          <p className="mt-2 text-4xl font-semibold text-[var(--text-primary)]">
            {attendedStudents.size} / {expectedStudents.length}
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
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
            Current class
          </p>
          {slotsLoading || !isFetchedAfterMount ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Loading class…
            </p>
          ) : selectedSlot ? (
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {selectedSlot.moduleCode} · {selectedSlot.moduleName}
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {selectedSlot.venue}
              </p>
              {(slotData?.slotList.filter((slot) => slot.state === "AVAILABLE")
                .length ?? 0) > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setConflictOpen(true)}
                >
                  Change class
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              {slotData?.requiresSelection
                ? "Choose which class is currently running."
                : "No attendance class is currently available."}
            </p>
          )}
        </div>

        <ConflictingEventDialog
          open={Boolean(slotData?.requiresSelection) || conflictOpen}
          onOpenChange={setConflictOpen}
          slots={slots.filter((slot) => slot.state === "AVAILABLE")}
          selectedSlotId={selectedSlot?.id ?? null}
          busy={selectingSlot}
          onSelect={(slot) => void handleSlotSelect(slot)}
        />

        <label
          htmlFor="student-list-upload"
          className={`flex min-h-[150px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-6 text-center transition-colors duration-200 ${
            selectedEventID
              ? "group cursor-pointer border-[var(--border)] hover:border-[var(--btn-primary-bg)] hover:bg-[var(--bg-elevated)]"
              : "cursor-not-allowed border-[var(--border)] opacity-50"
          }`}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-primary)]">
            <Upload size={22} strokeWidth={1.8} />
          </div>

          <p className="text-base font-medium text-[var(--text-primary)]">
            Upload student list
          </p>

          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            CSV, TXT or MD · 8 digit numbers
          </p>

          <input
            id="student-list-upload"
            type="file"
            accept=".csv,.txt,.md,text/csv,text/plain,text/markdown"
            onChange={handleFileUpload}
            disabled={!selectedEventID}
            className="sr-only"
          />
        </label>

        {fileName && (
          <p className="text-sm text-[var(--text-secondary)]">
            {fileName} · {expectedStudents.length} students
          </p>
        )}

        <Button
          type="button"
          disabled={!selectedEventID || expectedStudents.length === 0}
          onClick={startSession}
          className="w-full"
        >
          Start scanning
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
          <div className="aspect-video w-full rounded-xl border-2 border-[var(--border)]">
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

      <LastScannedStudent studentNumber={lastScan} />

      <Button type="button" onClick={endSession} className="w-full">
        End Attendance Session
      </Button>
    </div>
  );
}
