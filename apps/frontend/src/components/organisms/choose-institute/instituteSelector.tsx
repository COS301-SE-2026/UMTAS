"use client";

import { useState } from "react";
import { ApprovalStatus } from "@/components/molecules/choose-institute/ApprovalStatus";
import { SelectInstituteField } from "@/components/molecules/choose-institute/SelectInstituteField";
import { SelectRoleField } from "@/components/molecules/choose-institute/SelectRoleField";
import { Button } from "@/components/atoms/baseShadcn/button";

interface InstituteSelectorProps {
  onInstituteSelected: (instituteId: string, role: string) => void;
  passedRole?: string;
}

export function InstituteSelector({
  passedRole,
  onInstituteSelected,
}: InstituteSelectorProps) {
  const institutes = [
    { id: "1", name: "UCT" },
    { id: "2", name: "Stellies" },
  ];

  const [selectedInstitute, setSelectedInstitute] = useState("");
  const [selectedRole, setSelectedRole] = useState("Student");

  // mock for now(sorry johan)
  const [approvalStatus] = useState<"approved" | "pending" | "rejected" | null>(
    passedRole ? "pending" : null,
  );

  const roleWasPassedIn = Boolean(passedRole);
  const isApproved = roleWasPassedIn && approvalStatus === "approved";
  const isNotApproved =
    roleWasPassedIn && approvalStatus !== "approved" && approvalStatus !== null;

  //1: no role passed in -> free role choice which defaults to student
  //2: approved -> role is locked to the passed-in role
  //3: not approved -> role is forced to student, but user is informed that their role is not yet approved
  const finalRole = !roleWasPassedIn
    ? selectedRole
    : isApproved
      ? passedRole!
      : "Student";

  const canConfirm = selectedInstitute !== "";

  function handleConfirm() {
    onInstituteSelected(selectedInstitute, finalRole);
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        handleConfirm();
      }}
    >
      <SelectInstituteField
        institutes={institutes}
        value={selectedInstitute}
        onChange={setSelectedInstitute}
        onNotSupportedClick={() => {
          /* add functionality here */
        }}
      />

      {/* 1 */}
      {!roleWasPassedIn && (
        <SelectRoleField value={selectedRole} onChange={setSelectedRole} />
      )}

      {/* 3 */}
      {isNotApproved && selectedInstitute && (
        <ApprovalStatus
          status={approvalStatus}
          universityName={
            institutes.find((i) => i.id === selectedInstitute)?.name ?? ""
          }
        />
      )}

      {/* 2 */}
      {isApproved && selectedInstitute && (
        <ApprovalStatus
          status={approvalStatus}
          universityName={
            institutes.find((i) => i.id === selectedInstitute)?.name ?? ""
          }
        />
      )}

      <div className="mt-2 flex justify-end gap-3 border-t pt-4">
        <Button type="submit" disabled={!canConfirm}>
          {isNotApproved ? "Continue as Student" : "Confirm"}
        </Button>
      </div>
    </form>
  );
}
