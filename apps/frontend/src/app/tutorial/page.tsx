import TutorialShell from "@/components/templates/tutorial/TutorialShell";
import Tutorial from "@/components/organisms/nav/Tutorial";

import { builderSection } from "../builder/HelpPage";
import { courseSection } from "../course-management/HelpPage";
import { dashboardSection } from "../dashboard/HelpPage";
import { moduleManagementSection } from "../module-management/HelpPage";
import { roleManagementSection } from "../role-management/HelpPage";
import { schedulesSection } from "../schedules/HelpPage";
import { solverSection } from "../solver/HelpPage";

const allTutorialSections = [
  dashboardSection,
  solverSection,
  builderSection,
  schedulesSection,
  moduleManagementSection,
  roleManagementSection,
  courseSection,
];

const steps = [
  {
    target: "#tutorial-guide-select",
    content: "Select the page you would like help with.",
  },
  {
    target: "#tutorial-guide-section",
    content: "Follow the selected guide here for step-by-step instructions.",
  },
];

export default function TutorialPage() {
  return (
    <>
      <Tutorial steps={steps} wait={true} />

      <div className="flex flex-col h-full bg-[var(--bg-base)] p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            UMTAS User Manual
          </h1>

          <p className="text-md font-normal text-[var(--text-secondary)]">
            Follow the visual guides below to manage your modular timetable.
          </p>
        </div>

        <TutorialShell sections={allTutorialSections} />
      </div>
    </>
  );
}
