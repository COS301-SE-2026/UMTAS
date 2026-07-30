import {
  HelpPageSection,
  HelpStep,
  createHelpPage,
} from "../../types/HelpPage";

const page = "Manage Modules & Events";

const steps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "View all Modules",
    description: `By default you will see all the modules for your institute.`,
  },
  {
    stepNumber: 2,
    title: "Search/Filter for a certain module/s",
    description: `To Search for a specific module use the 'Search' box, also add filters using the dropdown menu 'All Prefixes'.`,
  },
  {
    stepNumber: 3,
    title: "Edit a Module",
    description: `To edit a module, simply click on the module you wish to edit, change the relative fields and click 'Save Changes'.`,
  },
];

export const HelpPage: HelpPageSection = createHelpPage(page, {
  roles: ["UNIVERSITY_ADMIN", "LECTURER"],
  steps,
});
