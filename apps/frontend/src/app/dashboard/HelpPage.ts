import {
  HelpPageSection,
  HelpStep,
  createHelpPage,
} from "../../types/HelpPage";

const page = "Home";

const steps: HelpStep[] = [
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

export const HelpPage: HelpPageSection = createHelpPage(page, {
  steps,
});
