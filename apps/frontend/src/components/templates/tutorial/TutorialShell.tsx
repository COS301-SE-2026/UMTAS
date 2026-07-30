"use client";

import { useState, useMemo } from "react";
import TutorialSection from "@/components/organisms/tutorial/TutorialSection";
import { HelpPageSection } from "@/types/HelpPage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";

export interface TutorialShellProps {
  sections: HelpPageSection[];
}

export default function TutorialShell({ sections }: TutorialShellProps) {
  const [selectedSection, setSelectedSection] = useState<string>(
    sections?.[0]?.id || "",
  );

  const activeSection = useMemo(
    () =>
      sections.find((section) => section.id === selectedSection) || sections[0],
    [sections, selectedSection],
  );

  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="w-full md:max-w-[300px]">
        <p className="text-sm font-normal text-[var(--text-secondary)] pb-2">
          Select your Guide
        </p>
        <Select value={selectedSection} onValueChange={setSelectedSection}>
          <SelectTrigger
            className="w-fit bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)] rounded-lg 
          shadow-md ring-offset-[var(--bg-base)] focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2"
          >
            <SelectValue placeholder="Select a tutorial" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)] rounded-xl shadow-md">
            {sections.map((section) => (
              <SelectItem
                key={section.id}
                value={section.id}
                className="text-[var(--text-primary)] focus:bg-[var(--bg-elevated)] focus:text-[var(--text-primary)] 
                rounded-md cursor-pointer transition-colors duration-[var(--duration-fast)] ease-in-out"
              >
                {section.pageName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        {activeSection && <TutorialSection section={activeSection} />}
      </div>
    </div>
  );
}
