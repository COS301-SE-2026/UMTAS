import TutorialShell from "@/components/templates/tutorial/TutorialShell";
import { HelpPageSection, HelpStep } from "@/types/HelpPage";

const mockHelpStep1: HelpStep = {
  description: "descr",
  stepNumber: 1,
  title: "builder",
};

const mockHelpStep2: HelpStep = {
  description: "descr",
  stepNumber: 2,
  title: "builder",
};

const mockHelpSection: HelpPageSection = {
  id: "123",
  category: "help",
  description: "help my asseblief",
  pageName: "my fav",
  pageImage: { url: "" },
  steps: [mockHelpStep1, mockHelpStep2],
  relatedPageIds: ["1"],
};

export default function TutorialPage() {
  return (
    <div>
      <TutorialShell sections={[mockHelpSection]} />
    </div>
  );
}
