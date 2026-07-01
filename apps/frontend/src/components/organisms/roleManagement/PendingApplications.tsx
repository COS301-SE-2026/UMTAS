import { columns } from "@/components/molecules/roleManagement/PendingApplicationsColumns";
import { DataTable } from "@/components/molecules/roleManagement/DataTable";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { application } from "@/components/molecules/roleManagement/PendingApplicationsColumns";

async function getData(): Promise<application[]> {
  return [
    {
      id: "3b8d9f1a",
      name: "Robert Wilson",
      email: "robert.wilson@up.ac.za",
      appliedRole: "Lecturer",
    },
    {
      id: "7c2e4a6b",
      name: "Laura Martinez",
      email: "laura.martinez@up.ac.za",
      appliedRole: "Uni Admin",
    },
    {
      id: "9f1a3b8d",
      name: "David Kim",
      email: "david.kim@up.ac.za",
      appliedRole: "Student",
    },
    {
      id: "2a6b7c2e",
      name: "Anna Nguyen",
      email: "anna.nguyen@up.ac.za",
      appliedRole: "Lecturer",
    },
    {
      id: "5d4e3f2a",
      name: "Michael Brown",
      email: "michael.brown@up.ac.za",
      appliedRole: "Student",
    },
    // ...
  ];
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
