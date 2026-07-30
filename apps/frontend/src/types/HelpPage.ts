export interface HelpStep {
  stepNumber: number;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface HelpPageSection {
  id: string;
  pageName: string;
  category: string;
  description: string;
  pageImage?: {
    url: string;
    altText?: string;
    imageDescription?: string;
  };
  steps: HelpStep[];
  relatedPageIds?: string[]; //link to the actual page (router.push(/page))
}
