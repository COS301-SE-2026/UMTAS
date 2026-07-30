import TutorialStep from "@/components/molecules/tutorial/TutorialStep";
import { HelpPageSection } from "@/types/HelpPage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { Separator } from "@/components/atoms/baseShadcn/separator";

export interface TutorialSectionProps {
  section: HelpPageSection;
}

export default function TutorialSection({ section }: TutorialSectionProps) {
  return (
    <Card className="w-full bg-[var(--bg-surface)] border-[var(--border)] shadow-md rounded-xl overflow-hidden p-0">
      {section.pageImage?.url && (
        <div className="w-full bg-[var(--bg-elevated)] border-b border-[var(--border)] relative overflow-hidden">
          <img
            src={section.pageImage.url}
            alt={section.pageImage.altText || section.pageName}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <CardHeader className="p-6 md:p-8 pb-6">
        <div className="flex justify-between items-start mb-4">
          <Badge
            className="uppercase font-medium bg-[var(--bg-elevated)] text-[var(--text-primary)] 
            hover:bg-[var(--bg-elevated)] rounded-full px-4 py-2 border-[var(--border)]"
          >
            {section.category}
          </Badge>
        </div>
        <CardTitle className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          {section.pageName}
        </CardTitle>
        <CardDescription className="text-md text-[var(--text-secondary)] font-normal">
          {section.description}
        </CardDescription>
        {section.pageImage?.imageDescription && (
          <p className="text-md text-[var(--text-secondary)] mt-4 border-l-2 border-[var(--border)] pl-4">
            {section.pageImage.imageDescription}
          </p>
        )}
      </CardHeader>
      <Separator className="bg-[var(--border)]" />
      <CardContent className="p-6 md:p-8 flex flex-col gap-12 bg-[var(--bg-base)]">
        {section.steps.map((step) => (
          <TutorialStep key={step.stepNumber} step={step} />
        ))}
      </CardContent>
    </Card>
  );
}
