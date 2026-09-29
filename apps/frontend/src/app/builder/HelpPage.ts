import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const builderSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "Create a module",
    description: `Click the 'Add Module' button to create a new default module that belongs to you.`,
    imageUrl: "/images/Builder/steps/1.png",
  },
  {
    stepNumber: 2,
    title: "Update Module details",
    description: `Click on the Module card to reveal its details.`,
    imageUrl: "/images/Builder/steps/2.png",
  },
  {
    stepNumber: 3,
    title: "Update Module Code",
    description: `Fill in the input box for the module Code`,
    imageUrl: "/images/Builder/steps/3.png",
  },
  {
    stepNumber: 4,
    title: "Update Module Name",
    description: `Fill in the input box for the module Name`,
    imageUrl: "/images/Builder/steps/4.png",
  },
  {
    stepNumber: 5,
    title: "Confirm Changes",
    description: `Click on Confirm to update the module details`,
    imageUrl: "/images/Builder/steps/6.png",
  },
  {
    stepNumber: 6,
    title: "Move to events tab",
    description: `Click on Next: Events to go to the event creation tab`,
    imageUrl: "/images/Builder/steps/7.png",
  },
  {
    stepNumber: 7,
    title: "Add Event",
    description: `Click Add Event to create an event`,
    imageUrl: "/images/Builder/steps/8.png",
  },
  {
    stepNumber: 8,
    title: "Reveal Event details",
    description: `Click on the card to reveal all Event details`,
    imageUrl: "/images/Builder/steps/9.png",
  },
  {
    stepNumber: 9,
    title: "Event details",
    description: `All event details can be modified here`,
    imageUrl: "/images/Builder/steps/10.png",
  },
  {
    stepNumber: 10,
    title: "Save event Details",
    description: `Click confirm to save event details `,
    imageUrl: "/images/Builder/steps/11.png",
  },
  {
    stepNumber: 11,
    title: "Move to Create Timetable tab",
    description: `Click Create timetable to go to creating a timetable`,
    imageUrl: "/images/Builder/steps/12.png",
  },
  {
    stepNumber: 12,
    title: "Name your timetable",
    description: `Fill in the input box with your schedules name `,
    imageUrl: "/images/Builder/steps/13.png",
  },
  {
    stepNumber: 13,
    title: "Review Events",
    description: `Review all the events you wish to use in this schedule`,
    imageUrl: "/images/Builder/steps/14.png",
  },
  {
    stepNumber: 14,
    title: "Add events into the schedule",
    description: `Click on the checkbox to add an event into the schedule`,
    imageUrl: "/images/Builder/steps/15.png",
  },
  {
    stepNumber: 15,
    title: "Generate timetable",
    description: `Click on the Generate Timetable button to create your timetable / schedule`,
    imageUrl: "/images/Builder/steps/16.png",
  },
  {
    stepNumber: 16,
    title: "View Created Schedule",
    description: ``,
    imageUrl: "/images/Builder/steps/17.png",
  },
];

export const builderSection: HelpPageSection = {
  id: "builder",
  title: "Event Builder",
  description: "Build Modules and Events to Create a Timetable.",
  pageName: "Builder Page",
  pageImage: {
    url: "/images/Builder/image.png",
    //altText: "builder image",
  },
  roles: ["all"],
  steps: builderSteps,
};
