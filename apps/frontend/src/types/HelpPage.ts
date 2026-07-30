import { rolesTypeType } from "@/app/role-management/queries/builder";

export type HelpRoles = rolesTypeType | "all";

export interface HelpPageSection {
  id: string;
  pageName: string;
  title: string;
  roles: HelpRoles[];
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
