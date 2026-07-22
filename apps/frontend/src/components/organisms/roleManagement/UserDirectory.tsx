"use client";
import { columns } from "@/components/molecules/roleManagement/UserDirectoryColumns";
import { DataTable } from "@/components/molecules/roleManagement/DataTable";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { getAllApplicationsQ } from "@/app/role-management/queries/applyQueries";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/atoms/baseShadcn/spinner";
import { UserDetails } from "@/lib/userclass/userClass";

export default function UserDirectoryCard() {
  const Uni = UserDetails.getUniDetails();
  const { data = [], isLoading } = useQuery(
    getAllApplicationsQ(
      { universityID: Uni?.UniversityID || "" },
      { pending: false },
    ),
  );

  return (
    <div className="container mx-auto">
      <Card className="bg-[var(--bg-surface)] border-[var(--border)] rounded-xl shadow-sm">
        <CardHeader>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Role Management
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage user roles and approve pending applications.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Spinner className="size-4" />
          ) : (
            <DataTable columns={columns} data={data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
