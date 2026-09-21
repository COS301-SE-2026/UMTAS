"use client";

import AttendanceCounter from "./AttendanceCounter";
import { LastScannedStudent } from "./LastScannedStudent";

import { ChangeEvent, useCallback, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Upload } from "lucide-react";

import { BarcodeCamera } from "@/components/molecules/attendance/BarcodeCamera";
import { ScannerBadge } from "@/components/molecules/attendance/ScannerBadge";
import { StudentNumberInput } from "@/components/molecules/attendance/USBBarcodeScanner";

import { updateAttendanceCountMut } from "@/components/templates/attendance/Queries/attendanceQueries";
import { assignMeToModuleMut } from "@/components/templates/attendance/Queries/teachesQueries";

import { useUniversityState } from "@/hooks/useUniversityState";

import { fetchAllModulesv2 } from "../../../../utilities/V2-Builders/Modules";

import { Switch } from "@/components/atoms/baseShadcn/switch";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Button } from "@/components/atoms/baseShadcn/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/baseShadcn/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/atoms/baseShadcn/command";

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

  const [selectedModuleID, setSelectedModuleID] = useState("");
  const [selectedEventID, setSelectedEventID] = useState("");

  const [eventPickerOpen, setEventPickerOpen] = useState(false);

  const { university, isLoading: universityLoading } = useUniversityState();

  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["attendance-modules", university?.UniversityID ?? ""],

    queryFn: async () => {
      const response = await fetchAllModulesv2({
        universityId: university?.UniversityID,
        userEnrollment: false,
      });

      return response.modules ?? [];
    },

    enabled: !universityLoading && university?.UniversityID != null,
  });

  const { mutate: updateAttendanceCount } = useMutation(
    updateAttendanceCountMut(),
  );

  const {
    mutate: assignMeToModule,
    isPending: isJoiningModule,
    isSuccess: moduleReady,
    reset: resetModuleMutation,
  } = useMutation(assignMeToModuleMut());

  const selectedModule = modules.find(
    (module) => module.moduleID === selectedModuleID,
  );

  const moduleEvents = selectedModule?.Events ?? [];

  const selectedEvent = moduleEvents.find(
    (event) => event.eventId === selectedEventID,
  );

  const resetUploadedList = () => {
    setExpectedStudents([]);
    setAttendedStudents(new Set());
    setFileName(null);
    setLastScan(null);
  };

  const handleModuleChange = (moduleID: string) => {
    setSelectedModuleID(moduleID);
    setSelectedEventID("");
    setEventPickerOpen(false);

    resetUploadedList();
    resetModuleMutation();
  };

  const handleUseModule = () => {
    if (!selectedModuleID) return;

    assignMeToModule(selectedModuleID);
  };

  const handleEventChange = (eventID: string) => {
    setSelectedEventID(eventID);

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

  const handleScan = useCallback(
    (studentNumber: string) => {
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
    },
    [
      expectedStudents,
      selectedEventID,
      sessionEnded,
      sessionStarted,
      updateAttendanceCount,
    ],
  );

  const startSession = () => {
    if (
      expectedStudents.length === 0 ||
      !selectedModuleID ||
      !selectedEventID
    ) {
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

    setSelectedModuleID("");
    setSelectedEventID("");

    setSessionStarted(false);
    setSessionEnded(false);

    setEventPickerOpen(false);

    setStatus("READY");

    resetModuleMutation();
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
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Attendance Setup
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Select a module, event and expected student list.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="attendance-module">Module</Label>

          <Select value={selectedModuleID} onValueChange={handleModuleChange}>
            <SelectTrigger id="attendance-module" className="w-full">
              <SelectValue
                placeholder={
                  modulesLoading ? "Loading modules..." : "Select module"
                }
              />
            </SelectTrigger>

            <SelectContent>
              {modules.map((module) => (
                <SelectItem key={module.moduleID} value={module.moduleID}>
                  {module.moduleCode} - {module.moduleName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={!selectedModuleID || isJoiningModule || moduleReady}
          onClick={handleUseModule}
          className="w-full"
        >
          {isJoiningModule
            ? "Setting Up Module..."
            : moduleReady
              ? "Module Ready"
              : "Use This Module"}
        </Button>

        <div className="flex flex-col gap-2">
          <Label>Event</Label>

          <Popover open={eventPickerOpen} onOpenChange={setEventPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={eventPickerOpen}
                disabled={!moduleReady}
                className="h-10 w-full justify-between px-3 font-normal"
              >
                <span className="truncate text-left">
                  {selectedEvent
                    ? `${selectedEvent.eventName}${
                        selectedEvent.activityCode
                          ? ` • ${selectedEvent.activityCode}`
                          : ""
                      }`
                    : moduleReady
                      ? "Select event"
                      : "Select and use a module first"}
                </span>

                <ChevronsUpDown
                  size={16}
                  className="ml-2 shrink-0 opacity-50"
                />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              className="w-[520px] max-w-[90vw] p-0"
            >
              <Command>
                <CommandInput placeholder="Search events..." />

                <CommandList>
                  <CommandEmpty>No events found.</CommandEmpty>

                  <CommandGroup>
                    {moduleEvents.map((event) => {
                      const selected = selectedEventID === event.eventId;

                      const dayOrDate = event.isRecurring
                        ? event.eventCriteria?.dayOfWeek || "Recurring"
                        : event.eventCriteria?.date || "No date";

                      const startTime =
                        event.eventCriteria?.startTime || "--:--";

                      const endTime = event.eventCriteria?.endTime || "--:--";

                      return (
                        <CommandItem
                          key={event.eventId}
                          value={`${event.eventName} ${
                            event.activityCode ?? ""
                          } ${dayOrDate} ${startTime} ${endTime}`}
                          onSelect={() => {
                            handleEventChange(event.eventId);
                            setEventPickerOpen(false);
                          }}
                          className="cursor-pointer py-3"
                        >
                          <Check
                            size={16}
                            className={`mr-3 shrink-0 ${
                              selected ? "opacity-100" : "opacity-0"
                            }`}
                          />

                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                                {event.eventName}
                              </span>

                              {event.activityCode && (
                                <span className="shrink-0 rounded-md bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                                  {event.activityCode}
                                </span>
                              )}
                            </div>

                            <span className="text-xs text-[var(--text-secondary)]">
                              {dayOrDate} • {startTime} - {endTime}
                            </span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {moduleReady && moduleEvents.length === 0 && (
            <p className="text-xs text-[var(--text-secondary)]">
              No events are available for this module.
            </p>
          )}
        </div>

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
                : "Select an event before uploading a student list."}
            </p>
          )}
        </div>

        <Button
          type="button"
          disabled={
            !moduleReady || !selectedEventID || expectedStudents.length === 0
          }
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
