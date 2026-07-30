import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const roleSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "View all Users",
    description: `See all the users with their roles at your institute.`,
  },
  {
    stepNumber: 2,
    title: "Search/Filter for a certain Users/Roles",
    description: `To search or filter for certain Users/roles, use the search box and filter dropdown for certain roles.`,
  },
  {
    stepNumber: 3,
    title: "Update a User's role",
    description: `To update a user's role simple select the role from the user's dropdown and click the 'Update' button.`,
  },
  {
    stepNumber: 4,
    title: `View next/previous page`,
    description: `To traverse to the next or previous page of users use the 'Previous'/'Next' buttons at the bottom of the table.`,
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
