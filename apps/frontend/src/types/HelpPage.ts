import { rolesTypeType } from "@/app/role-management/queries/builder";

export type HelpRoles = rolesTypeType | "all";

export interface HelpPageSection {
  id: string;
  pageName: string;
  title: string;
  roles: HelpRoles;
  description: string;
  pageImage: {
    url: string;
    altText?: string;
  };
  steps: HelpStep[];
  // relatedPageIds?: string[]; //link to the actual page (router.push(/page))
}

export interface HelpStep {
  stepNumber: number;
  title: string;
  description: string;
  imageUrl?: string;
}

export const createHelpPage = (
  pageName: string,
  overrides?: Partial<HelpPageSection>,
): HelpPageSection => ({
  id: `${pageName.toLowerCase()}_HelpPage`,
  pageName,
  title: `How to use the ${pageName} page`,
  roles: "all",
  description: `This section will guide you through using the ${pageName} page.`,
  pageImage: {
    url: `../../images/${pageName}/image.png`,
    altText: `Image of the ${pageName} page`,
  },
  steps: [],

  ...overrides,
}); //END_createHelpPage
