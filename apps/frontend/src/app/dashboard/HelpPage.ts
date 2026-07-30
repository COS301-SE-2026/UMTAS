import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const dashboardSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "Build your own schedule",
    description: `Click the 'Build a schedule' button to start building your own custom schedule.`,
  },
  {
    stepNumber: 2,
    title: "Access resources.",
    description: "Access our Documentation, Brand Style or Github",
  },
];

export const dashboardSection: HelpPageSection = {
  id: "dashboard",
  title: "Dashboard",
  description: "Access Resources or Build a Timetable.",
  pageName: "Home Page",
  pageImage: {
    url: "/images/Dashboard/image.png",
    //altText: "c",
  },
  roles: ["all"],
  steps: dashboardSteps,
};
