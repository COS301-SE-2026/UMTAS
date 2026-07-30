import TutorialSection from "@/components/organisms/tutorial/TutorialSection";
import { HelpPageSection, HelpStep } from "@/types/HelpPage";

// export interface HelpStep {
//   stepNumber: number;
//   title: string;
//   description: string;
//   imageUrl?: string;
// }

// export interface HelpPageSection {
//   id: string;
//   pageName: string;
//   category: string;
//   description: string;
//   pageImage?: {
//     url: string;
//     altText?: string;
//     imageDescription?: string;
//   };
//   steps: HelpStep[];
//   relatedPageIds?: string[]; //link to the actual page (router.push(/page))
// }

export interface TutorialShellProps {
  sections: HelpPageSection[];
}

export default function TutorialShell({ sections }: TutorialShellProps) {
  return (
    <>
      {sections.map((section) => {
        return (
          <>
            <TutorialSection key={section.id} section={section} />
          </>
        );
      })}
    </>
  );
}
