import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const moduleSteps: HelpStep[] = [
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

export const moduleManagementSection: HelpPageSection = {
  id: "module-management",
  title: "Module Management",
  description:
    "Filter and Edit Modules and Events and Add Modules to Courses. ",
  pageName: "Modules Page",
  pageImage: {
    url: "/images/ModuleManagement/image.png",
    //altText: "c",
  },
  roles: ["all"],
  steps: moduleSteps,
};
