"use client";

import { useEffect, useState } from "react";
import { ApprovalStatus } from "@/components/molecules/choose-institute/ApprovalStatus";
import { SelectInstituteField } from "@/components/molecules/choose-institute/SelectInstituteField";
import { SelectRoleField } from "@/components/molecules/choose-institute/SelectRoleField";
import { Button } from "@/components/atoms/baseShadcn/button";
import { uniDto } from "@/components/templates/choose-institute/queries/builders";
import { useQuery } from "@tanstack/react-query";
import { getAllUni } from "@/components/templates/choose-institute/queries/UserRoleQueries";

export function InstituteSelector() {
  const [selectedInstitute, setSelectedInstitute] = useState<uniDto>();

  const { data: uniList, isLoading: uniLoading } = useQuery(getAllUni());

  /*
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
*/
  function updateSelectedUni(id: string) {
    const nUni = uniList?.universities.find((uni) => uni.UniversityID === id);
    setSelectedInstitute(nUni);
  }

  function handleConfirm() {
    //
  }
  useEffect(() => {}, [selectedInstitute]);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        handleConfirm();
      }}
    >
      <SelectInstituteField
        institutes={uniList?.universities || []}
        value={selectedInstitute?.UniversityName || ""}
        onChange={updateSelectedUni}
        onNotSupportedClick={() => {
          /* werk hierso haha */
        }}
      />

      {/*!roleWasPassedIn && (
        <SelectRoleField value={selectedRole} onChange={setSelectedRole} />
      )*/}

      {/*      {isNotApproved && selectedInstitute && (
        <ApprovalStatus
          status={selectedInstitute.role || "pending"}
          universityName={selectedInstitute.UniversityName}
        />
      )*/}

      {selectedInstitute && <ApprovalStatus uni={selectedInstitute} />}

      <div className="mt-2 flex justify-end gap-3 border-t pt-4">
        <Button type="submit" disabled={!false}>
          {true ? "Continue as Student" : "Confirm"}
        </Button>
      </div>
    </form>
  );
}
