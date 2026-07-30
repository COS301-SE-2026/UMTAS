"use client";
import UserDirectoryCard from "@/components/organisms/roleManagement/UserDirectory";
import { UserDetails } from "@/lib/userclass/userClass";
import { useRouter } from "next/navigation";
import Tutorial from "@/components/organisms/nav/Tutorial";
import NotFound from "@/app/not-found";
import NoRoleSelected from "@/components/molecules/roleManagement/NoRoleSelected";
const steps = [
  {
    target: "#input-search-name-email-role",
    content: "Search for a user by name, email, or role.",
  },
  {
    target: "#select-all-roles",
    content: "Filter the user list by role.",
  },
  {
    target: "#btn-columns-to-show",
    content: "Choose which columns to display.",
  },
  {
    target: "#select-the-row-in-table",
    content: "Select a row from the table.",
  },
  {
    target: "#select-role-for-the-user",
    content: "Assign a role to the selected user.",
  },
  {
    target: "#update-role-of-user",
    content: "Update the user’s role to the chosen role.",
  },
  {
    target: "#btn-role-previous",
    content: "Go to the previous page of users.",
  },
  {
    target: "#btn-role-next",
    content: "Go to the next page of users.",
  },
];

export default function RoleManagementTemplate() {
  const router = useRouter();
  const UniDetails = UserDetails.getUniDetails();
  const ViableRole = UniDetails?.role === "UNIVERSITY_ADMIN";

  if (UniDetails === null) {
    router.push("/dashboard");
  }

  if (ViableRole) {
    const hasRole = UniDetails?.role != null;
    if (!hasRole) return <NoRoleSelected />;

    return (
      <>
        <Tutorial steps={steps} wait={true} />
        <UserDirectoryCard />
      </>
    );
  } else {
    return <NotFound />;
  }
}
