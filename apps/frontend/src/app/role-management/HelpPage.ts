import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const roleSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "View all Users",
    description: `See all the users with their roles at your institute.`,
    imageUrl: "/images/Roles/steps/image.png",
  },
  {
    stepNumber: 2,
    title: "Search/Filter for a certain Users/Roles",
    description: `To search or filter for certain Users/roles, use the search box and filter dropdown for certain roles.`,
    imageUrl: "/images/Roles/steps/2.png",
  },
  {
    stepNumber: 3,
    title: "Change a User's role",
    description: `To update a user's role simple select the role from the user's dropdown`,
    imageUrl: "/images/Roles/steps/select.png",
  },
  {
    stepNumber: 4,
    title: "Save changes to a User's role",
    description: `Click on the update button in the users role`,
    imageUrl: "/images/Roles/steps/4.png",
  },
];

export const roleManagementSection: HelpPageSection = {
  id: "role-management",
  title: "Role Management",
  description: "Filter Users and Apply/Update Roles.",
  pageName: "Roles Page",
  pageImage: {
    url: "/images/Roles/image.png",
    //altText: "c",
  },
  roles: ["all"],
  steps: roleSteps,
};
