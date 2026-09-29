"use client";

import NotFound from "@/app/not-found";
import { AttendanceDateStamp } from "@/components/atoms/attendance/AttendanceDateStamp";
import { AttendancePageHeader } from "@/components/molecules/attendance/AttendancePageHeader";
import NoRoleSelected from "@/components/molecules/roleManagement/NoRoleSelected";
import { AttendanceOverviewPanel } from "@/components/organisms/attendance/AttendanceOverviewPanel";
import Tutorial from "@/components/organisms/nav/Tutorial";
import {
  UniversityStateLoading,
  useUniversityState,
} from "@/hooks/useUniversityState";

const steps = [
  {
    target: "#attendance-header",
    content: "View the attendance overview and current date.",
  },
  {
    target: "#classes",
    content: "View scheduled classes for today.",
  },
];

export default function AttendanceTemplate() {
  const { university, isLoading } = useUniversityState();
  if (isLoading) return <UniversityStateLoading />;
  if (!university?.role) return <NoRoleSelected />;
  if (!["UNIVERSITY_ADMIN", "LECTURER"].includes(university.role)) {
    return <NotFound />;
  }
  return (
    <div className="w-full px-8 pt-6">
      <Tutorial steps={steps} wait={true} />
      <div
        id="attendance-header"
        className="mx-auto flex w-full max-w-6xl flex-col gap-6"
      >
        <AttendancePageHeader
          className="w-full border-b border-[var(--border)] pb-4"
          title="Attendance"
          meta={<AttendanceDateStamp date={new Date()} />}
        />

        <AttendanceOverviewPanel />
      </div>
    </div>
  );
}
