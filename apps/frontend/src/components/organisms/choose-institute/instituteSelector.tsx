"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { ApprovalStatus } from "@/components/molecules/choose-institute/ApprovalStatus";
import { SelectInstituteField } from "@/components/molecules/choose-institute/SelectInstituteField";
import { SelectRoleField } from "@/components/molecules/choose-institute/SelectRoleField";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/atoms/baseShadcn/alert";

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

  function isApprovedRole(role: uniDto["role"] | undefined) {
    return (
      role === "LECTURER" ||
      role === "STUDENT" ||
      role === "UNIVERSITY_ADMIN" ||
      role === "STUDENT_OWNED"
    );
  }

  function getPendingRole(role: uniDto["role"] | undefined) {
    if (role === "LECTURER_PENDING") {
      return "LECTURER";
    }

    if (role === "UNIVERSITY_ADMIN_PENDING") {
      return "UNIVERSITY_ADMIN";
    }

    return null;
  }

  const hasApprovedRole = isApprovedRole(selectedInstitute?.role);

  const pendingRole = getPendingRole(selectedInstitute?.role);

  const isPending = applyMut.isPending || selectUniMut.isPending;

  function updateSelectedUni(id: string) {
    const university = uniList?.universities.find(
      (uni) => uni.UniversityID === id,
    );

    setSelectedInstitute(university);
    setSelectedRole("");
    setSuccessMessage(null);
  }

  function handleClose() {
    setSelectedInstitute(undefined);
    setSelectedRole("");
    setSuccessMessage(null);

    onClose?.();
  }

  function continueWithRole(role: string) {
    if (!selectedInstitute?.UniversityID) {
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
            role: role as uniDtoRoles,
          });

          getQueryClient().clear();

          setSuccessMessage(
            `Continuing as ${role
              .toLowerCase()
              .replaceAll("_", " ")
              .replace(/\b\w/g, (char) => char.toUpperCase())}...`,
          );

          setTimeout(() => {
            handleClose();
          }, 500);
        },

        onError: (error) => {
          console.error("Failed to select university:", error);
        },
      },
    );
  }

  function handleContinueApprovedRole() {
    if (!selectedInstitute?.role || !isApprovedRole(selectedInstitute.role)) {
      return;
    }

    continueWithRole(selectedInstitute.role);
  }

  function handleContinueAsStudent() {
    if (!selectedInstitute?.UniversityID) {
      return;
    }

    if (
      selectedInstitute.role === "STUDENT" ||
      selectedInstitute.role === "STUDENT_OWNED"
    ) {
      continueWithRole(selectedInstitute.role);
      return;
    }

    applyMut.mutate(
      {
        UniversityID: selectedInstitute.UniversityID,
        role: "STUDENT",
      },
      {
        onSuccess: () => {
          continueWithRole("STUDENT");
        },

        onError: (error) => {
          console.error("Failed to continue as student:", error);
        },
      },
    );
  }

  function handleApply() {
    if (
      !selectedInstitute?.UniversityID ||
      !selectedRole ||
      selectedRole === "STUDENT"
    ) {
      return;
    }

    applyMut.mutate(
      {
        UniversityID: selectedInstitute.UniversityID,
        role: selectedRole as uniDtoRoles,
      },
      {
        onSuccess: async () => {
          await getQueryClient().invalidateQueries({
            queryKey: getAllUni().queryKey,
          });

          setSuccessMessage("Application submitted successfully!");

          setTimeout(() => {
            handleClose();
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
    selectedRole === "STUDENT" ||
    selectedRole === selectedInstitute.role ||
    selectedRole === pendingRole ||
    isPending;

  return (
    <>
      <Tutorial steps={steps} wait={true} />

      <form
        className="flex w-full min-w-0 flex-col gap-6"
        onSubmit={(e) => e.preventDefault()}
      >
        {successMessage && (
          <div className="rounded-md bg-[var(--success-bg)] p-2 text-center text-sm font-medium text-[var(--success-text)]">
            {successMessage}
          </div>
        )}

        <SelectInstituteField
          institutes={uniList?.universities || []}
          value={selectedInstitute?.UniversityID || ""}
          onChange={updateSelectedUni}
          onNotSupportedClick={handleClose}
        />

        <div className="flex w-full flex-col gap-2">
          <SelectRoleField
            value={selectedRole}
            onChange={setSelectedRole}
            disabled={!selectedInstitute}
          />

          <div className="flex w-full justify-center">
            {selectedInstitute ? (
              <button
                type="button"
                id="btn-clear-role"
                className="text-xs text-[var(--text-secondary)] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                disabled={selectedRole === ""}
                onClick={() => setSelectedRole("")}
              >
                Clear role
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Select an institute first
              </p>
            )}
          </div>
        </div>

        {selectedInstitute ? (
          selectedRole === "STUDENT" ? (
            <Alert variant="success" className="max-w-md">
              <AlertTitle>Student access available</AlertTitle>

              <AlertDescription>
                Students do not require approval. You can continue as a student
                at {selectedInstitute.UniversityName}.
              </AlertDescription>
            </Alert>
          ) : (
            <ApprovalStatus uni={selectedInstitute} />
          )
        ) : (
          <Alert variant="default" className="max-w-md">
            <AlertTitle>No institute selected</AlertTitle>

            <AlertDescription>
              Select an institute above to view your role and access options.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex w-full flex-col gap-3 border-t pt-4">
          <div className="flex w-full items-center justify-center gap-4">
            {!selectedInstitute && (
              <Button type="button" variant="outline" disabled>
                Select an institute to continue
              </Button>
            )}

            {selectedInstitute && selectedRole === "STUDENT" && (
              <Button
                data-testid="btn-continue"
                id="btn-continue-as-role"
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={handleContinueAsStudent}
              >
                Continue as Student
              </Button>
            )}

            {selectedInstitute &&
              selectedRole !== "STUDENT" &&
              hasApprovedRole && (
                <Button
                  data-testid="btn-continue"
                  id="btn-continue-as-role"
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={handleContinueApprovedRole}
                >
                  Continue as{" "}
                  {selectedInstitute.role
                    ?.toLowerCase()
                    .replaceAll("_", " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
                </Button>
              )}

            {selectedInstitute &&
              selectedRole &&
              selectedRole !== "STUDENT" &&
              hasApprovedRole && (
                <p className="text-sm text-muted-foreground">or</p>
              )}

            {selectedInstitute &&
              selectedRole &&
              selectedRole !== "STUDENT" && (
                <Button
                  id="btn-apply-for-role"
                  type="button"
                  variant="outline"
                  disabled={applyDisabled}
                  onClick={handleApply}
                >
                  Apply for{" "}
                  {selectedRole
                    .toLowerCase()
                    .replaceAll("_", " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
                </Button>
              )}

            {selectedInstitute && !selectedRole && !hasApprovedRole && (
              <Button type="button" variant="outline" disabled>
                Select a role to continue
              </Button>
            )}
          </div>

          <div className="mt-2 flex w-full items-center justify-center">
            <Button
              type="button"
              variant="default"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
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
