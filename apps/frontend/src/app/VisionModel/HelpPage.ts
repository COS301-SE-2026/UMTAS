import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const solverSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "Select PDF",
    description: `Select your university provided timetable file.`,
    imageUrl: `/images/Solver/steps/3.png`,
  },
];

export const VisionModelSection: HelpPageSection = {
  id: "Lecture Watch",
  title: "Lecture Watch",
  description: "Get an analysis on your lectures",
  pageName: "Lecture Watch",
  pageImage: {
    url: "/images/VM/image.png",
    //altText: "c",
  },
  roles: ["all"],
  steps: solverSteps,
};
