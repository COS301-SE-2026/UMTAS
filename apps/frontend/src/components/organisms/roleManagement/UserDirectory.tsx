"use client";
import { columns } from "@/components/molecules/roleManagement/UserDirectoryColumns";
import { DataTable } from "@/components/molecules/roleManagement/DataTable";
import { getAllApplicationsQ } from "@/app/role-management/queries/applyQueries";
import { useQuery } from "@tanstack/react-query";
import { UserDetails } from "@/lib/userclass/userClass";

export default function UserDirectoryCard() {
  const Uni = UserDetails.getUniDetails();
  const { data = [], isLoading } = useQuery(
    getAllApplicationsQ(
      { universityID: Uni?.UniversityID || "" },
      { pending: false },
    ),
  );

  if (isLoading) {
    return (
      <div className="h-full w-full flex justify-center items-center py-20">
        Loading...
      </div>
    );
  }

  return <DataTable columns={columns} data={data} />;
}
