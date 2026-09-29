import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const solverSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "Select PDF",
    description: `Select your university provided timetable file.`,
    imageUrl: `/images/Solver/steps/3.png`,
  },
  {
    stepNumber: 2,
    title: "Upload PDF",
    description: `Click on the upload button to start the pdf upload`,
    imageUrl: `/images/Solver/steps/4.png`,
  },
  {
    stepNumber: 3,
    title: "Processing PDF",
    description: `wait a moment while we process your PDF`,
    imageUrl: `/images/Solver/steps/5.png`,
  },
  {
    stepNumber: 4,
    title: "Confirm events",
    description: `Once events are displayed click confirm events to continue`,
    imageUrl: `/images/Solver/steps/6.png`,
  },
  {
    stepNumber: 5,
    title: "Solving your schedule",
    description: `Once events are confirmed you can name and solve your schedule`,
    imageUrl: `/images/Solver/steps/8.png`,
  },
  {
    stepNumber: 6,
    title: "Selecting a preference",
    description: `Select all the preferences you wish to solve your timetable around by checking the box`,
    imageUrl: `/images/Solver/steps/9.png`,
  },
  {
    stepNumber: 7,
    title: "Finalizing your schedule",
    description: `Once you are happy with your preferences, you can click upload and create timetable`,
    imageUrl: `/images/Solver/steps/10.png`,
  },
  {
    stepNumber: 8,
    title: "Solving in process",
    description: `Wait a moment while we clean your schedule up`,
    imageUrl: `/images/Solver/steps/11.png`,
  },
  {
    stepNumber: 9,
    title: "Viewing your schedule",
    description: `Once finished we will redirect you to the schedules page`,
    imageUrl: `/images/Solver/steps/12.png`,
  },
];

export const solverSection: HelpPageSection = {
  id: "solver",
  title: "Upload PDF",
  description:
    "Upload Your Timetable PDF, Review Your Events and Check Your Preferences.",
  pageName: "Upload Page",
  pageImage: {
    url: "/images/Solver/image.png",
    //altText: "c",
  },
  roles: ["all"],
  steps: solverSteps,
};
