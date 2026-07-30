import TutorialShell from "@/components/templates/tutorial/TutorialShell";
import { HelpPageSection, HelpStep } from "@/types/HelpPage";

const mockHelpStep1: HelpStep = {
  description: "Builder is my favourite dude. Click here to see man.",
  stepNumber: 1,
  title: "Navigate to the builder ",
  imageUrl: "url cool",
};

const mockHelpStep2: HelpStep = {
  description: "Add modules man, so cool",
  stepNumber: 2,
  title: "Select modules",
  imageUrl: "cool link",
};

const mockHelpSection: HelpPageSection = {
  title: "",
  roles: [],
  id: "123",
  description: "Learn cool stuff",
  pageName: "Builder",
  pageImage: {
    url: "cool builder link",
    altText: "Builder",
  },
  steps: [mockHelpStep1, mockHelpStep2],
};

const mockHelpSection2: HelpPageSection = {
  id: "124",
  title: "",
  roles: [],
  description: "Learn the funnnn of setting up your timetable.",
  pageName: "Builder for noobs",
  pageImage: {
    url: "cool link",
    altText: "alt alt",
  },
  steps: [mockHelpStep1, mockHelpStep2],
};

export default function TutorialPage() {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)] p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
          UMTAS Help Center
        </h1>
        <p className="text-md font-normal text-[var(--text-secondary)]">
          Follow the visual guides below to manage your modular timetable.
        </p>
      </div>
      <TutorialShell sections={[mockHelpSection, mockHelpSection2]} />
    </div>
  );
}
