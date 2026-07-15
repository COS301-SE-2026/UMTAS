import { columns } from "@/components/molecules/roleManagement/PendingApplicationsColumns";
import { DataTable } from "@/components/molecules/roleManagement/DataTable";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { application } from "@/components/molecules/roleManagement/PendingApplicationsColumns";

async function getData(): Promise<application[]> {
  return [];
}

export default async function PendingApplicationsCard() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Pending Applications</CardTitle>
          <CardDescription>
            View and manage pending role applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
