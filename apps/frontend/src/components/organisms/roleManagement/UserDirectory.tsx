import {
  columns,
  user,
} from "@/components/molecules/roleManagement/UserDirectoryColumns";
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

async function getData(): Promise<user[]> {
  return [
    {
      id: "3b8d9f1a",
      name: "Robert Wilson",
      email: "robert.wilson@up.ac.za",
      role: "Lecturer",
    },
    {
      id: "7c2e4a6b",
      name: "Laura Martinez",
      email: "laura.martinez@up.ac.za",
      role: "Uni Admin",
    },
    {
      id: "9f1a3b8d",
      name: "David Kim",
      email: "david.kim@up.ac.za",
      role: "Student",
    },
    {
      id: "2a6b7c2e",
      name: "Anna Nguyen",
      email: "anna.nguyen@up.ac.za",
      role: "Lecturer",
    },
    {
      id: "5d4e3f2a",
      name: "Michael Brown",
      email: "michael.brown@up.ac.za",
      role: "Student",
    },
    // ...
  ];
}

export default async function UserDirectoryCard() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>View and manage user information</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
