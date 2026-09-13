"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { ApprovalStatus } from "@/components/molecules/choose-institute/ApprovalStatus";
import { SelectInstituteField } from "@/components/molecules/choose-institute/SelectInstituteField";
import { SelectRoleField } from "@/components/molecules/choose-institute/SelectRoleField";
import { Button } from "@/components/atoms/baseShadcn/button";
import Tutorial from "@/components/organisms/nav/Tutorial";

import { uniDto, uniDtoRoles } from "@/app/choose-institute/queries/builders";

import {
  applyMutator,
  getAllUni,
  selectUniMutator,
} from "@/app/choose-institute/queries/UserRoleQueries";

import { UserDetails } from "@/lib/userclass/userClass";
import { getQueryClient } from "@/components/tanstack/getQueryClient";

const steps = [
  {
    target: "#institute-select",
    content: "Choose your university from the list.",
  },
  {
    target: "#link-university-not-supported",
    content: "If your university isn’t listed, visit the builder page.",
  },
  {
    target: "#role-select",
    content: "Pick the role you’d like to apply for.",
  },
  {
    target: "#btn-clear-role",
    content: "Remove your selected role.",
  },
  {
    target: "#btn-continue-as-role",
    content: "Proceed with your previously approved role.",
  },
  {
    target: "#btn-apply-for-role",
    content: "Submit your application for the role at the chosen university.",
  },
];

interface InstituteSelectorProps {
  onClose?: () => void;
}

export function InstituteSelector({ onClose }: InstituteSelectorProps) {
  const [selectedInstitute, setSelectedInstitute] = useState<uniDto>();
  const [selectedRole, setSelectedRole] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: uniList } = useQuery(getAllUni());

  const applyMut = useMutation(applyMutator());
  const selectUniMut = useMutation(selectUniMutator());

  function updateSelectedUni(id: string) {
    const university = uniList?.universities.find(
      (uni) => uni.UniversityID === id,
    );

    setSelectedInstitute(university);
    setSelectedRole("");
    setSuccessMessage(null);
  }

  function handleContinue() {
    if (!selectedInstitute?.UniversityID || !selectedInstitute.role) {
      return;
    }

    selectUniMut.mutate(
      {
        uniId: selectedInstitute.UniversityID,
      },
      {
        onSuccess: () => {
          UserDetails.storeUniDetails({
            UniversityID: selectedInstitute.UniversityID,
            UniversityName: selectedInstitute.UniversityName,
            role: selectedInstitute.role!,
          });

          getQueryClient().clear();

          setSuccessMessage("Successfully continued!");

          setTimeout(() => {
            onClose?.();
          }, 500);
        },
        onError: (error) => {
          console.error("Failed to select university:", error);
        },
      },
    );
  }

  function handleApply() {
    if (!selectedInstitute?.UniversityID || !selectedRole) {
      return;
    }

    applyMut.mutate(
      {
        UniversityID: selectedInstitute.UniversityID,
        role: selectedRole as uniDtoRoles,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Application submitted successfully!");

          setTimeout(() => {
            onClose?.();
          }, 1700);
        },
        onError: (error) => {
          console.error("Failed to apply for role:", error);
        },
      },
    );
  }

  const applyDisabled =
    !selectedInstitute ||
    !selectedRole ||
    selectedRole === selectedInstitute.role ||
    selectUniMut.isPending ||
    applyMut.isPending;

  return (
    <>
      <Tutorial steps={steps} wait={true} />

      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => e.preventDefault()}
      >
        {successMessage && (
          <div className="p-2 text-sm text-[var(--success-text)] bg-[var(--success-bg)] rounded-md text-center font-medium">
            {successMessage}
          </div>
        )}

        <SelectInstituteField
          institutes={uniList?.universities || []}
          value={selectedInstitute?.UniversityID || ""}
          onChange={updateSelectedUni}
          onNotSupportedClick={() => onClose?.()}
        />

        {selectedInstitute && (
          <>
            <SelectRoleField value={selectedRole} onChange={setSelectedRole} />

            <div className="w-full items-center flex flex-col">
              <button
                type="button"
                id="btn-clear-role"
                className="text-xs text-[var(--text-secondary)] underline-offset-2 hover:underline"
                disabled={selectedRole === ""}
                onClick={() => setSelectedRole("")}
              >
                Clear role
              </button>
            </div>
          </>
        )}

        {selectedInstitute && <ApprovalStatus uni={selectedInstitute} />}

        <div className="flex flex-col mt-2 gap-3 border-t pt-4">
          {selectedInstitute && (
            <div className="w-full flex items-center justify-center gap-4">
              {selectedInstitute.role && (
                <Button
                  data-testid="btn-continue"
                  id="btn-continue-as-role"
                  type="button"
                  variant="outline"
                  disabled={selectUniMut.isPending}
                  onClick={handleContinue}
                >
                  Continue as {selectedInstitute.role}
                </Button>
              )}

              {selectedInstitute.role && selectedRole && (
                <p className="text-sm text-muted-foreground">or</p>
              )}

              {selectedRole && (
                <Button
                  id="btn-apply-for-role"
                  type="button"
                  variant="outline"
                  disabled={applyDisabled}
                  onClick={handleApply}
                >
                  Apply for {selectedRole}
                </Button>
              )}
            </div>
          )}

          <div className="w-full flex items-center justify-center mt-2">
            <Button type="button" variant="default" onClick={() => onClose?.()}>
              Close
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
