"use client";
import UserDirectoryCard from "@/components/organisms/roleManagement/UserDirectory";
import PendingApplicationsCard from "@/components/organisms/roleManagement/PendingApplications";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/baseShadcn/tabs";
import { UserDetails } from "@/lib/userclass/userClass";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/baseShadcn/button";

export default function RoleManagementTemplate() {
  const router = useRouter();
  const UniDetails = UserDetails.getUniDetails();
  const ViableRole = UniDetails?.role === "UNIVERSITY_ADMIN";

  if (ViableRole) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          Role Management
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Manage user roles and approve pending applications.
        </p>
        <UserDirectoryCard />
      </div>
    );
  } else {
    return (
      <div>
        You do not have permisions to view this page
        <Button onClick={() => router.push("/dashboard")}>
          {"Navigate to home"}
        </Button>
      </div>
    );
  }
}

/*
<Tabs defaultValue="User Directory" className="w-full">
  <TabsList>
    <TabsTrigger value="User Directory">User Directory</TabsTrigger>
    <TabsTrigger value="Pending Applications">
      Pending Applications
    </TabsTrigger>
  </TabsList>
  <TabsContent value="User Directory">
    {" "}
    <UserDirectoryCard />
  </TabsContent>
  <TabsContent value="Pending Applications">
    {" "}
    <PendingApplicationsCard />
  </TabsContent>
</Tabs>
*/
