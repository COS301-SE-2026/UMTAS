"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NotFound from "@/app/not-found";
import { Button } from "@/components/atoms/baseShadcn/button";
import { AttendancePageHeader } from "@/components/molecules/attendance/AttendancePageHeader";
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
  return (
    <div className="flex w-full flex-col items-center px-6 pt-6">
      <div className="w-full max-w-6xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
        <AttendancePageHeader
          className="px-5 py-4"
          title="Register NFC sticker"
          description="Register, replace, and test the sticker students use to check in."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/attendance">
                <ArrowLeft size={14} aria-hidden="true" /> Back to attendance
              </Link>
            </Button>
          }
        />
        <div className="mx-auto w-full max-w-3xl p-5">
          <NfcTagRegistrationPanel />
        </div>
      </div>
    </div>
  );
}
