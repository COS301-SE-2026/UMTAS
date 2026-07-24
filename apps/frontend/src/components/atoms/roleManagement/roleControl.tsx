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
  // returns 2 buttons confirm / deny ==> runs the tanstack query
  const approveMut = useMutation(ApproveMutator());
  return (
    <div className="flex justify-center ">
      <Button
        className="ml-5"
        onClick={() =>
          approveMut.mutate({
            UniversityID: row.UniversityID,
            userId: row.UserID,
            isApproved: true,
          })
        }
      >
        Approve
      </Button>
      <Button
        className="ml-5"
        onClick={() =>
          approveMut.mutate({
            UniversityID: row.UniversityID,
            userId: row.UserID,
            isApproved: false,
          })
        }
      >
        Deny
      </Button>
    </div>
  );
}
function RoleSelectElement({ row }: pageProps) {
  // returns a select with all the types of roles to set a user to.
  // Will make use of an updated endpoint
  const selectOptions = arrRolesValid;
  const [selectRole, updateRole] = useState<rolesTypeType>(row.role);
  const approveMut = useMutation(ApproveMutator());
  return (
    <div className=" flex justify-center ">
      <Select
        defaultValue={row.role || "UNSET"}
        onValueChange={(newRole) => {
          updateRole(newRole as rolesTypeType);
        }}
      >
        <SelectTrigger id="select-role-for-the-user">
          <SelectValue placeholder="Select a Role"></SelectValue>
        </SelectTrigger>

        <SelectContent>
          {selectOptions.map((option, idx) => {
            return (
              <SelectItem key={idx} value={option}>
                {option}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <Button
        id="update-role-of-user"
        className="ml-5"
        onClick={() =>
          approveMut.mutate({
            UniversityID: row.UniversityID,
            userId: row.UserID,
            isApproved: true,
            provdedRole: selectRole,
          })
        }
      >
        Update
      </Button>
    </div>
  );
}

export default function RoleControl({ row }: pageProps) {
  const pending = isPendingRequest(row);
  if (pending) {
    return <PendingElement row={row} />;
  } else {
    return <RoleSelectElement row={row} />;
  }
}
