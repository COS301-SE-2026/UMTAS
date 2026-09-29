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
      <div className="w-full px-8 pt-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <AttendancePageHeader
            className="w-full border-b border-[var(--border)] pb-4"
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

          <AttendanceScanner />
        </div>
      </div>
    );
  } else {
    return <NotFound />;
  }
}
