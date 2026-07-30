import TutorialStep from "@/components/molecules/tutorial/TutorialStep";
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

export interface TutorialSectionProps {
  section: HelpPageSection;
}

export default function TutorialSection({ section }: TutorialSectionProps) {
  return (
    <>
      <p>id: {section.id}</p>
      <p>Page name: {section.pageName}</p>
      <p>Category: {section.category}</p>
      <p>Description: {section.description}</p>
      <p>Page image url: {section.pageImage?.url}</p>
      <p>
        Steps:{" "}
        {section.steps.map((step) => {
          return (
            <>
              <TutorialStep key={step.stepNumber} step={step} />
            </>
          );
        })}
      </p>
    </>
  );
}
