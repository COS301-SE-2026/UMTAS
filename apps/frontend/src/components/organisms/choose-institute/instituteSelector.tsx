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
  selectUniMutator,
} from "@/app/choose-institute/queries/UserRoleQueries";
import { UserDetails } from "@/lib/userclass/userClass";

import Tutorial from "@/components/organisms/nav/Tutorial";
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

  const { data: uniList, isLoading: uniLoading } = useQuery(getAllUni());
  const applyMut = useMutation(applyMutator());
  const selectUniMut = useMutation(selectUniMutator());

  function triggerSuccessAndClose(msg: string) {
    setSuccessMessage(msg);
  }

  function updateSelectedUni(id: string) {
    const nUni = uniList?.universities.find((uni) => uni.UniversityID === id);
    setSelectedInstitute(nUni);

    if (id) {
      selectUniMut.mutate(
        { uniId: id },
        {
          onSuccess: () => {
            triggerSuccessAndClose("Institute successfully selected!");
          },
          onError: (error) => console.error("Failed to select role:", error),
        },
      );
    }
  }

  function handleConfirm() {
    UserDetails.storeUniDetails(selectedInstitute);
  }

  const applyDisabled =
    !selectedInstitute || !selectedRole || selectUniMut.isPending;

  return (
    <>
      <Tutorial steps={steps} wait={true} />

      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirm();
        }}
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
          onNotSupportedClick={() => {
            /* werk hierso haha */
          }}
        />
        <SelectRoleField value={selectedRole} onChange={setSelectedRole} />
        <div className="w-full items-center flex flex-col">
          <button
            id="btn-clear-role"
            className="text-xs text-[var(--text-secondary)] underline-offset-2 hover:underline"
            disabled={selectedRole == ""}
            onClick={() => setSelectedRole("")}
          >
            Clear role
          </button>
        </div>

        {selectedInstitute && <ApprovalStatus uni={selectedInstitute} />}
        <div className="flex flex-col mt-2 justify-around gap-3 border-t pt-4">
          <div className="flex justify-center items-center gap-4 w-full">
            <div className="flex-1 flex justify-end">
              <Button
                id="btn-continue-as-role"
                type="button"
                variant={"outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirm();
                  triggerSuccessAndClose("Successfully continued!");
                }}
              >
                Continue as {selectedInstitute?.role ?? "Student"}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">or</p>
            <div className="flex-1 flex justify-start">
              <Button
                id="btn-apply-for-role"
                type="button"
                variant={"outline"}
                disabled={applyDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirm();
                  applyMut.mutate(
                    {
                      UniversityID: selectedInstitute?.UniversityID || "",
                      role: selectedRole as uniDtoRoles,
                    },
                    {
                      onSuccess: () => {
                        triggerSuccessAndClose(
                          "Application submitted successfully!",
                        );
                      },
                    },
                  );
                }}
              >
                {"Apply for role"}
              </Button>
            </div>
          </div>

          <div className="w-full flex items-center justify-center mt-2">
            <Button
              type="button"
              variant="default"
              onClick={(e) => {
                onClose?.();
                e.stopPropagation();
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
