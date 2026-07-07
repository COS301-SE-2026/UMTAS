"use client";

import { useState } from "react";
import { ApprovalStatus } from "@/components/molecules/choose-institute/ApprovalStatus";
import { SelectInstituteField } from "@/components/molecules/choose-institute/SelectInstituteField";
import { SelectRoleField } from "@/components/molecules/choose-institute/SelectRoleField";
import { Button } from "@/components/atoms/baseShadcn/button";
import { uniDto, uniDtoRoles } from "@/app/choose-institute/queries/builders";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  applyMutator,
  getAllUni,
} from "@/app/choose-institute/queries/UserRoleQueries";
import { UserDetails } from "@/lib/userclass/userClass";

export function InstituteSelector() {
  const [selectedInstitute, setSelectedInstitute] = useState<uniDto>();

  const [selectedRole, setSelectedRole] = useState("");
  const { data: uniList, isLoading: uniLoading } = useQuery(getAllUni());
  const applyMut = useMutation(applyMutator());

  function updateSelectedUni(id: string) {
    const nUni = uniList?.universities.find((uni) => uni.UniversityID === id);
    setSelectedInstitute(nUni);
  }

  function handleConfirm() {
    UserDetails.storeUniDetails(selectedInstitute);
  }
  const applyDisabled = !selectedInstitute || !selectedRole;
  const uniDisabeled =
    selectedInstitute == null && selectedInstitute == undefined;

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
        value={selectedInstitute?.UniversityID || ""}
        onChange={updateSelectedUni}
        onNotSupportedClick={() => {
          /* werk hierso haha */
        }}
      />

      <SelectRoleField value={selectedRole} onChange={setSelectedRole} />

      {/*      {isNotApproved && selectedInstitute && (
        <ApprovalStatus
          status={selectedInstitute.role || "pending"}
          universityName={selectedInstitute.UniversityName}
        />
      )*/}

      {selectedInstitute && <ApprovalStatus uni={selectedInstitute} />}

      <div className="mt-2 flex justify-end gap-3 border-t pt-4">
        <Button type="submit" disabled={uniDisabeled}>
          continue as {selectedInstitute?.role ?? "student"}
        </Button>
      </div>
      <div className="mt-2 flex justify-end gap-3 border-t pt-4">
        <Button
          type="submit"
          disabled={applyDisabled}
          onClick={() => {
            applyMut.mutate({
              UniversityID: selectedInstitute?.UniversityID || "",
              role: selectedRole as uniDtoRoles,
            });
          }}
        >
          {"Apply for role"}
        </Button>
      </div>
    </form>
  );
}
