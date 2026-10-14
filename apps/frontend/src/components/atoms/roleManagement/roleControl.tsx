// depending on the details in a row will change what requests it sends

import {
  arrRolesValid,
  getSingleApplication,
  rolesTypeType,
} from "@/app/role-management/queries/builder";
import { Button } from "../baseShadcn/button";
import { useMutation } from "@tanstack/react-query";
import { ApproveMutator } from "@/app/role-management/queries/applyQueries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../baseShadcn/select";
import { useState } from "react";
import { toast } from "sonner";

function isPendingRequest(row: getSingleApplication) {
  const userRole = row.role;

  return (
    userRole === "LECTURER_PENDING" || userRole === "UNIVERSITY_ADMIN_PENDING"
  );
}

interface pageProps {
  row: getSingleApplication;
}

function PendingElement({ row }: pageProps) {
  const approveMut = useMutation(ApproveMutator());

  return (
    <div className="flex justify-center">
      <Button
        className="ml-5"
        disabled={approveMut.isPending}
        onClick={() =>
          approveMut.mutate(
            {
              UniversityID: row.UniversityID,
              userId: row.UserID,
              isApproved: true,
            },
            {
              onSuccess: () => {
                toast.success("Role application approved successfully");
              },
              onError: () => {
                toast.error("Failed to approve role application");
              },
            },
          )
        }
      >
        Approve
      </Button>

      <Button
        className="ml-5"
        disabled={approveMut.isPending}
        onClick={() =>
          approveMut.mutate(
            {
              UniversityID: row.UniversityID,
              userId: row.UserID,
              isApproved: false,
            },
            {
              onSuccess: () => {
                toast.success("Role application denied successfully");
              },
              onError: () => {
                toast.error("Failed to deny role application");
              },
            },
          )
        }
      >
        Deny
      </Button>
    </div>
  );
}

function RoleSelectElement({ row }: pageProps) {
  const selectOptions = arrRolesValid;
  const [selectRole, updateRole] = useState<rolesTypeType>(row.role);
  const approveMut = useMutation(ApproveMutator());

  return (
    <div className="flex justify-center">
      <Select
        defaultValue={row.role || "UNSET"}
        onValueChange={(newRole) => {
          updateRole(newRole as rolesTypeType);
        }}
      >
        <SelectTrigger
          data-testid="select-user-role"
          id="select-role-for-the-user"
        >
          <SelectValue placeholder="Select a Role" />
        </SelectTrigger>

        <SelectContent>
          {selectOptions.map((option, idx) => (
            <SelectItem key={idx} value={option}>
              {formatRoleLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        data-testid="update-role-btn"
        id="update-role-of-user"
        className="ml-5"
        disabled={approveMut.isPending}
        onClick={() =>
          approveMut.mutate(
            {
              UniversityID: row.UniversityID,
              userId: row.UserID,
              isApproved: true,
              provdedRole: selectRole,
            },
            {
              onSuccess: () => {
                toast.success("User role updated successfully");
              },
              onError: () => {
                toast.error("Failed to update user role");
              },
            },
          )
        }
      >
        Update
      </Button>
    </div>
  );
}

export function formatRoleLabel(role: string) {
  return role
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function RoleControl({ row }: pageProps) {
  const pending = isPendingRequest(row);

  if (pending) {
    return <PendingElement row={row} />;
  }

  return <RoleSelectElement row={row} />;
}
