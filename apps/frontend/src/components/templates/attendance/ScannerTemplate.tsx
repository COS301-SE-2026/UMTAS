"use client";

import NotFound from "@/app/not-found";
import NoRoleSelected from "@/components/molecules/roleManagement/NoRoleSelected";
import AttendanceScanner from "@/components/organisms/attendance/AttendanceScanner";
import {
  UniversityStateLoading,
  useUniversityState,
} from "@/hooks/useUniversityState";

export default function ScannerTemplate() {
  const { university, isLoading } = useUniversityState();
  const allowedRoles = ["UNIVERSITY_ADMIN", "LECTURER", "STUDENT"];
  const ViableRole = university?.role
    ? allowedRoles.includes(university.role)
    : false;

  if (isLoading) return <UniversityStateLoading />;

  if (ViableRole) {
    const hasRole = university?.role != null;
    if (!hasRole) return <NoRoleSelected />;

    // backend integration query will be called here
    //.....

    return (
      <div className="flex w-full flex-col items-center gap-6 px-6 pt-6">
        <div className="w-full max-w-6xl overflow-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Attendance Scanner
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Scan student cards to record attendance.
            </p>
          </div>

          <div className="mx-auto w-full max-w-md p-5">
            <AttendanceScanner
              // replace with expected attendance from backend integration
              expectedNumber={100}
            />
          </div>
        </div>
      </div>
    );
  } else {
    return <NotFound />;
  }
}
