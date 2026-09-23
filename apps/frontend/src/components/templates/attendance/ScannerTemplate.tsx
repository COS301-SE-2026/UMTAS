"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NotFound from "@/app/not-found";
import { Button } from "@/components/atoms/baseShadcn/button";
import { AttendancePageHeader } from "@/components/molecules/attendance/AttendancePageHeader";
import NoRoleSelected from "@/components/molecules/roleManagement/NoRoleSelected";
import AttendanceScanner from "@/components/organisms/attendance/AttendanceScanner";

import {
  UniversityStateLoading,
  useUniversityState,
} from "@/hooks/useUniversityState";

export default function ScannerTemplate() {
  const { university, isLoading } = useUniversityState();

  const allowedRoles = ["UNIVERSITY_ADMIN", "LECTURER"];

  const ViableRole = university?.role
    ? allowedRoles.includes(university.role)
    : false;

  if (isLoading) return <UniversityStateLoading />;

  if (ViableRole) {
    const hasRole = university?.role != null;

    if (!hasRole) return <NoRoleSelected />;

    return (
      <div className="flex w-full flex-col items-center gap-6 px-6 pt-6">
        <div className="w-full max-w-6xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
          <AttendancePageHeader
            className="px-5 py-4"
            title="Attendance Scanner"
            description="Upload a student list and scan student cards to record attendance."
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/attendance">
                  <ArrowLeft size={14} aria-hidden="true" /> Back to attendance
                </Link>
              </Button>
            }
          />

          <div className="mx-auto w-full max-w-3xl p-5">
            <AttendanceScanner />
          </div>
        </div>
      </div>
    );
  } else {
    return <NotFound />;
  }
}
