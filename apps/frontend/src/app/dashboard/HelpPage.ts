import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const dashboardSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "Build your own schedule",
    description: `Click the 'Build a schedule' button to start building your own custom schedule.`,
    imageUrl: `/images/Dashboard/steps/step1.png`,
  },
  {
    stepNumber: 2,
    title: "Access resources.",
    description: "Access our Documentation, Brand Style or Github",
    imageUrl: `/images/Dashboard/steps/step2.png`,
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
