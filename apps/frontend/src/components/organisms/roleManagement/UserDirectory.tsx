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

export default function UserDirectoryCard() {
  const { data = [], isLoading } = useQuery(getAllApplicationsQ());

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>View and manage user information</CardDescription>
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
