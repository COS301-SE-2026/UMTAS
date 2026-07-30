import {
  HelpPageSection,
  HelpStep,
  createHelpPage,
} from "../../types/HelpPage";

const page = "Manage Roles";

const steps: HelpStep[] = [
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

export const HelpPage: HelpPageSection = createHelpPage(page, {
  roles: ["UNIVERSITY_ADMIN"],
  steps,
});
