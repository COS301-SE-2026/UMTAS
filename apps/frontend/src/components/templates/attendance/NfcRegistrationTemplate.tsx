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
import Tutorial from "@/components/organisms/nav/Tutorial";

const steps = [
  {
    target: "#nfc-registration-header",
    content: "Register and manage the NFC sticker used for attendance.",
  },
  {
    target: "#btn-register-sticker",
    content: "Register your nfc sticker.",
  },
];

export default function NfcRegistrationTemplate() {
  const { university, isLoading } = useUniversityState();

  const allowedRoles = ["UNIVERSITY_ADMIN", "LECTURER"];

  const viableRole = university?.role
    ? allowedRoles.includes(university.role)
    : false;

  if (isLoading) {
    return <UniversityStateLoading />;
  }

  if (!viableRole) {
    return <NotFound />;
  }

  if (!university?.role) {
    return <NoRoleSelected />;
  }

  return (
    <div
      id="nfc-registration-header"
      className="flex w-full flex-col items-center gap-6 px-6 pt-6"
    >
      <Tutorial steps={steps} wait={true} />

      <AttendancePageHeader
        className="w-full max-w-6xl py-4"
        title="Register NFC sticker"
        description="Set up, replace and test the NFC sticker used for attendance."
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href="/attendance">
              <ArrowLeft size={14} aria-hidden="true" />
              Back to attendance
            </Link>
          </Button>
        }
      />

      <div id="nfc-registration-panel" className="mx-auto w-full max-w-5xl">
        <NfcTagRegistrationPanel />
      </div>
    </div>
  );
}
