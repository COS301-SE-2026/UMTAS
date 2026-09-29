"use client";

import NotFound from "@/app/not-found";
import { AttendanceDateStamp } from "@/components/atoms/attendance/AttendanceDateStamp";
import { AttendancePageHeader } from "@/components/molecules/attendance/AttendancePageHeader";
import NoRoleSelected from "@/components/molecules/roleManagement/NoRoleSelected";
import { AttendanceOverviewPanel } from "@/components/organisms/attendance/AttendanceOverviewPanel";
import {
  UniversityStateLoading,
  useUniversityState,
} from "@/hooks/useUniversityState";

export default function AttendanceTemplate() {
  const { university, isLoading } = useUniversityState();
  if (isLoading) return <UniversityStateLoading />;
  if (!university?.role) return <NoRoleSelected />;
  if (!["UNIVERSITY_ADMIN", "LECTURER"].includes(university.role)) {
    return <NotFound />;
  }
  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 pt-6">
      <AttendancePageHeader
        className="w-full max-w-6xl py-4"
        title="Attendance"
        meta={<AttendanceDateStamp date={new Date()} />}
      />

      <div className="w-full max-w-6xl">
        <AttendanceOverviewPanel />
      </div>
    </div>
  );
}
