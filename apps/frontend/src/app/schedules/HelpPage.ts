import {
  HelpPageSection,
  HelpStep,
  createHelpPage,
} from "../../types/HelpPage";

const page = "My Schedules";

const steps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "Select a Schedule",
    description: `Select the schedule you want to view from the dropdown.`,
  },
  {
    stepNumber: 2,
    title: "Customise your Schedule or Events",
    description: `To edit your timetable name or event's relative fields click the 'Edit' button.`,
  },
  {
    stepNumber: 3,
    title: "Delete Schedule",
    description: `To delete your schedule, click the 'Delete' button.`,
  },
  {
    stepNumber: 4,
    title: "View Schedule",
    description: `To view your full schedule, use the scroll bar to scroll through all the events on the schedule.`,
  },
  {
    stepNumber: 5,
    title: "View different week",
    description: `To view your schedule on a different week, use the arrow buttons surrounding the date to go to the previous or next week.`,
  },
];

export const dashboardHelpPage: HelpPageSection = createHelpPage(page, {
  roles: "all",
  steps,
});
