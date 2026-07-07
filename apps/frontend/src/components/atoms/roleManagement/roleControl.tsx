// depending on the details in a row will change what requests it sends

import { getSingleApplication } from "@/app/role-management/queries/builder";
import { Button } from "../baseShadcn/button";
import { useMutation } from "@tanstack/react-query";
import { ApproveMutator } from "@/app/role-management/queries/applyQueries";

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
    <div>
      <Button
        onClick={() =>
          approveMut.mutate({
            UniversityID: row.UniversityID,
            userId: row.UserID,
            isApproved: true,
          })
        }
      >
        confirm
      </Button>
      <Button
        onClick={() =>
          approveMut.mutate({
            UniversityID: row.UniversityID,
            userId: row.UserID,
            isApproved: false,
          })
        }
      >
        deny
      </Button>
    </div>
  );
}
function RoleSelectElement({ row }: pageProps) {
  // returns a select with all the types of roles to set a user to.
  // Will make use of an updated endpoint
  return <div></div>;
}

export default function RoleControl({ row }: pageProps) {
  const pending = isPendingRequest(row);
  if (pending) {
    return <PendingElement row={row} />;
  } else {
    return <RoleSelectElement row={row} />;
  }
}
