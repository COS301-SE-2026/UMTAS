import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const schedulesSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "Select a Schedule",
    description: `Select the schedule you want to view from the dropdown.`,
    imageUrl: "/images/Schedules/steps/step1.png",
  },
  {
    stepNumber: 2,
    title: "Customise your Schedule or Events",
    description: `To edit your timetable name or event's relative fields click the 'Edit' button.`,
    imageUrl: "/images/Schedules/steps/step2.png",
  },
  {
    stepNumber: 3,
    title: "Delete Schedule",
    description: `To delete your schedule, click the 'Delete' button.`,
    imageUrl: "/images/Schedules/steps/step3.png",
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
    imageUrl: "/images/Schedules/steps/step5.png",
  },
];

export const schedulesSection: HelpPageSection = {
  id: "schedules",
  title: "My Schedules",
  description: "View, Edit or Delete Your Timetable.",
  pageName: "Schedules Page",
  pageImage: {
    url: "/images/Schedules/image.png",
    //altText: "c",
  },
  roles: ["all"],
  steps: schedulesSteps,
};
