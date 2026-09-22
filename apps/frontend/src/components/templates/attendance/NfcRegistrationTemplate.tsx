"use client";

import NotFound from "@/app/not-found";
import NoRoleSelected from "@/components/molecules/roleManagement/NoRoleSelected";
import { NfcTagRegistrationPanel } from "@/components/organisms/attendance/NfcTagRegistrationPanel";
import {
  UniversityStateLoading,
  useUniversityState,
} from "@/hooks/useUniversityState";

export default function NfcRegistrationTemplate() {
  const { university, isLoading } = useUniversityState();
  if (isLoading) return <UniversityStateLoading />;
  if (!university?.role) return <NoRoleSelected />;
  if (!["UNIVERSITY_ADMIN", "LECTURER"].includes(university.role)) {
    return <NotFound />;
  }
  return <NfcTagRegistrationPanel />;
}
