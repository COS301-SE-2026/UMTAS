"use client";

import AttendanceCounter from "./AttendanceCounter";
import { LastScannedStudent } from "./LastScannedStudent";

import { ChangeEvent, useState } from "react";
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

  const [selectedSlotOverride, setSelectedSlotOverride] =
    useState<AttendanceSlot | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [selectingSlot, setSelectingSlot] = useState(false);

  const {
    data: slotData,
    isLoading: slotsLoading,
    refetch,
  } = useQuery(getAttendanceSlotsQ());
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
  const selectedSlot = selectedSlotOverride ?? currentSlot;
  const selectedEventID = selectedSlot?.eventID ?? "";

  const { mutate: updateAttendanceCount } = useMutation(
    updateAttendanceCountMut(),
  );

  const resetUploadedList = () => {
    setExpectedStudents([]);
    setAttendedStudents(new Set());
    setFileName(null);
    setLastScan(null);
  };

  const handleSlotSelect = async (slot: AttendanceSlot) => {
    setSelectingSlot(true);
    try {
      setSelectedSlotOverride(await selectPreferredEvent(slot));
      setConflictOpen(false);
      await refetch();
    } catch {
      setConflictOpen(true);
    } finally {
      setSelectingSlot(false);
    }
    resetUploadedList();
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !selectedEventID) return;

    const text = await file.text();

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

  const handleScan = (studentNumber: string) => {
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

    setAttendedStudents((current) => {
      if (current.has(cleanedStudentNumber)) {
        return current;
      }

      const updated = new Set(current);

      updated.add(cleanedStudentNumber);

      updateAttendanceCount({
        guestCount: updated.size,
        eventID: selectedEventID,
      });

      return updated;
    });

    setStatus("SUCCESS");

    window.setTimeout(() => {
      setStatus("READY");
    }, 1500);
  };

  const startSession = () => {
    if (expectedStudents.length === 0 || !selectedEventID) {
      return;
    }

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
      <div className="flex min-h-[650px] w-full flex-col items-center justify-center gap-6 text-center">
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
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Attendance Setup
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Confirm the automatically resolved class and upload the expected
            student list.
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <Label>Current class</Label>
          {slotsLoading ? (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Resolving current class…
            </p>
          ) : selectedSlot ? (
            <div className="mt-2">
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
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
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

        <div className="border-t border-[var(--border)]" />

        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            Student List
          </h3>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Upload the expected students for this attendance session.
          </p>
        </div>

        <label
          htmlFor="student-list-upload"
          className={`flex min-h-[210px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-8 text-center transition-colors duration-200 ${
            selectedEventID
              ? "group cursor-pointer border-[var(--border)] hover:border-[var(--btn-primary-bg)] hover:bg-[var(--bg-elevated)]"
              : "cursor-not-allowed border-[var(--border)] opacity-50"
          }`}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-primary)]">
            <Upload size={22} strokeWidth={1.8} />
          </div>

          <p className="text-base font-medium text-[var(--text-primary)]">
            Upload Student List
          </p>

          <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
            Select a CSV, TXT, or MD file containing 8 digit student numbers.
          </p>

          <div className="mt-5 rounded-md bg-[var(--btn-primary-bg)] px-4 py-2 text-sm font-medium text-[var(--btn-primary-text)]">
            Choose File
          </div>

          <p className="mt-3 text-xs text-[var(--text-secondary)]">
            CSV, TXT or MD
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

        <div className="min-h-[52px]">
          {fileName ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {fileName}
                </p>

                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {expectedStudents.length} students found
                </p>
              </div>

              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Ready
              </span>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              {selectedEventID
                ? "No student list uploaded."
                : "A current class is required before uploading a student list."}
            </p>
          )}
        </div>

        <Button
          type="button"
          disabled={!selectedEventID || expectedStudents.length === 0}
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
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Attendance Session Active
        </p>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Scan student cards or enter student numbers manually.
        </p>
      </div>

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

      <div className="w-full">
        <LastScannedStudent studentNumber={lastScan} />
      </div>

      <Button type="button" onClick={endSession} className="w-full">
        End Attendance Session
      </Button>
    </div>
  );
}
