"use client";

import NotFound from "@/app/not-found";
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
  return <AttendanceOverviewPanel />;
}
