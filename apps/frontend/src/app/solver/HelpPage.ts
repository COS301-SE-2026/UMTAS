import {
  HelpPageSection,
  HelpStep,
  createHelpPage,
} from "../../types/HelpPage";

const page = "Upload PDF";

const steps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "Upload your PDF",
    description: `Select the PDF timetable and select the 'upload' button to extract the events from your PDF.`,
  },
  {
    stepNumber: 2,
    title: "Review your Activities.",
    description: `Review the events extracted from the PDF before creating your schedule, and then click the 'Confirm Events' button.`,
  },
  {
    stepNumber: 3,
    title: "Set your preferences",
    description: `As a final step before generating your schedule set your schedule's name aswell as your preferences`,
  },
];

export const HelpPage: HelpPageSection = createHelpPage(page, {
  steps,
});
