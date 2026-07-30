import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const builderSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "Create a module",
    description: `Click the 'Add Module' button to create a new default module that belongs to you.`,
    imageUrl: "/images/Builder/steps/step1.png",
  },
  {
    stepNumber: 2,
    title: "Edit a module",
    description: `To edit a module, just click on the module, and you will be provided with the fields you can modify on the module after which you can just click 'Confirm'.`,
    imageUrl: "/images/Builder/steps/step2.png",
  },
  {
    stepNumber: 3,
    title: "Go to Events",
    description: `To create/modify events, click the 'Next: Events' button to go to the relevant page`,
    imageUrl: "/images/Builder/steps/step3.png",
  },
  {
    stepNumber: 4,
    title: "Create an event",
    description: `Create a new default event by clicking the 'Add Event' button.`,
    imageUrl: "/images/Builder/steps/step4.png",
  },
  {
    stepNumber: 5,
    title: "Edit an event",
    description: `To edit an event, just click on the event, and you will be provided with the fields you can modify on the event after which you can just click 'Confirm'`,
    imageUrl: "/images/Builder/steps/step5.png",
  },
  {
    stepNumber: 6,
    title: "Go to the Create Schedule",
    description: `To create your schedule, click the 'Create Timetable' button to go to the schedules page to create your schedule.`,
    imageUrl: "/images/Builder/steps/step6.png",
  },
  {
    stepNumber: 7,
    title: "Review and generate",
    description: `Select and customise the events you want to add to your schedule, also provide a name for your schedule.`,
    imageUrl: "/images/Builder/steps/step7.png",
  },
  {
    stepNumber: 8,
    title: `Create your schedule`,
    description: `After selecting at least one event, you can click the 'Generate Schedule' button to create your custom schedule.`,
    imageUrl: "/images/Builder/steps/step8.png",
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
