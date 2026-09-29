import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const schedulesSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "Create new Schedule",
    description: `Click the white timetable icon to create a new schedule`,
    imageUrl: "/images/Schedules/steps/1.png",
  },
  {
    stepNumber: 2,
    title: "Edit a Schedule ",
    description: `Click the pencil icon to edit a schedule `,
    imageUrl: "/images/Schedules/steps/2.png",
  },
  {
    stepNumber: 3,
    title: "Delete a schedule ",
    description: `Click on the Export ICS button to download an ics file of your schedule`,
    imageUrl: "/images/Schedules/steps/5.png",
  },
  {
    stepNumber: 4,
    title: "Export to google Calendar",
    description: `Click on the Google icon to export to Google calendar`,
    imageUrl: "/images/Schedules/steps/3.png",
  },
  {
    stepNumber: 5,
    title: "Export to ICS",
    description: `Click on the Export ICS button to download an ics file of your schedule`,
    imageUrl: "/images/Schedules/steps/4.png",
  },
  {
    stepNumber: 6,
    title: "Attendance",
    description: `Click on the event card to state you are planning to attend this event`,
    imageUrl: "/images/Schedules/steps/attend.png",
  },
  {
    stepNumber: 7,
    title: "Confirmation of planned attendance",
    description: `Once your plannded attendance is marked this notifcation will appear`,
    imageUrl: "/images/Schedules/steps/attendanceMarked.png",
  },
  {
    stepNumber: 8,
    title: "Choosing date range",
    description: `Click the icon to pick the week you wish to view`,
    imageUrl: "/images/Schedules/steps/chooseDate.png",
  },
  {
    stepNumber: 9,
    title: "Selecting a schedule",
    description: `Click on the dropdown to view and select all timetables available`,
    imageUrl: "/images/Schedules/steps/SelectSchedule.png",
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
