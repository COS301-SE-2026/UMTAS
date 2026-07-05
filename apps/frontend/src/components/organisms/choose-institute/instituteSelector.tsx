"use client";

import { useEffect, useState } from "react";
import { ApprovalStatus } from "@/components/molecules/choose-institute/ApprovalStatus";
import { SelectInstituteField } from "@/components/molecules/choose-institute/SelectInstituteField";
import { SelectRoleField } from "@/components/molecules/choose-institute/SelectRoleField";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  uniDto,
  uniDtoRoles,
} from "@/components/templates/choose-institute/queries/builders";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  applyMutator,
  getAllUni,
} from "@/components/templates/choose-institute/queries/UserRoleQueries";
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
    UserDetails.getInstance().storeUniDetails(selectedInstitute);
  }
  const applyDisabled = !selectedInstitute || !selectedRole;

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
        <Button type="submit" disabled={applyDisabled}>
          {true ? "Continue as Student" : "Confirm"}
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
