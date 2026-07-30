import { rolesTypeType } from "@/app/role-management/queries/builder";

export interface HelpPageSection {
  id: string;
  pageName: string;
  title: string;
  roles: rolesTypeType;
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
  roles: null,
  description: "",
  pageImage: { url: "" },
  steps: [],

  ...overrides,
}); //END_createHelpPage
