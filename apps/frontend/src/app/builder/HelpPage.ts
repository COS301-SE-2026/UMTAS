import {
  HelpPageSection,
  HelpStep,
  createHelpPage,
} from "../../types/HelpPage";

const page = "Event Builder";

const steps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "Create a module",
    description: `Click the 'Add Module' button to create a new default module that belongs to you.`,
  },
  {
    stepNumber: 2,
    title: "Edit a module",
    description: `To edit a module, just click on the module, and you will be provided with the fields you can modify on the module after which you can just click 'Confirm'.`,
  },
  {
    stepNumber: 3,
    title: "Go to Events",
    description: `To create/modify events, click the 'Next: Events' button to go to the relevant page`,
  },
  {
    stepNumber: 4,
    title: "Create an event",
    description: `Create a new default event by clicking the 'Add Event' button.`,
  },
  {
    stepNumber: 5,
    title: "Edit an event",
    description: `To edit an event, just click on the event, and you will be provided with the fields you can modify on the event after which you can just click 'Confirm'`,
  },
  {
    stepNumber: 6,
    title: "Go to the Create Schedule",
    description: `To create your schedule, click the 'Create Timetable' button to go to the schedules page to create your schedule.`,
  },
  {
    stepNumber: 7,
    title: "Review and generate",
    description: `Select and customise the events you want to add to your schedule, also provide a name for your schedule.`,
  },
  {
    stepNumber: 8,
    title: `Create your schedule`,
    description: `After selecting at least one event, you can click the 'Generate Schedule' button to create your custom schedule.`,
  },
];

export const HelpPage: HelpPageSection = createHelpPage(page, {
  steps,
});
