import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const moduleSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "View all Modules",
    description: `By default you will see all the modules for your institute.`,
    imageUrl: "/images/ModuleManagement/image.png",
  },
  {
    stepNumber: 2,
    title: "Filter Modules",
    description: `Filter Modules by code, name and enrollment`,
    imageUrl: "/images/ModuleManagement/steps/filter.png",
  },
  {
    stepNumber: 3,
    title: "Select a module",
    description: `Click on a module you wish to edit`,
    imageUrl: "/images/ModuleManagement/steps/selectmod.png",
  },
  {
    stepNumber: 4,
    title: "View Module Details to edit",
    description: `As a student you can enroll and change the module styling, as an admin you can edit module details`,
    imageUrl: "/images/ModuleManagement/steps/editMod.png",
  },
  {
    stepNumber: 5,
    title: "Events tab",
    description: `Click on the Events button to move to events`,
    imageUrl: "/images/ModuleManagement/steps/eventsTab.png",
  },
  {
    stepNumber: 6,
    title: "View Event",
    description: `Click on an event you wish to view`,
    imageUrl: "/images/ModuleManagement/steps/selectEvent.png",
  },
  {
    stepNumber: 7,
    title: "Event details",
    description: `Event details will then be displayed`,
    imageUrl: "/images/ModuleManagement/steps/updateEventDetails.png",
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
