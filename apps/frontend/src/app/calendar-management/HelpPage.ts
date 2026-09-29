import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const calendarSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "Calendar Filters",
    description: `Select Calendar by year`,
    imageUrl: `/images/Calendar/steps/filters.png`,
  },
  {
    stepNumber: 2,
    title: "Create Restriction",
    description: `Click on Create Restriction to add a new Restriction`,
    imageUrl: `/images/Calendar/steps/createRestriction.png`,
  },
  {
    stepNumber: 3,
    title: "Set Restriction Type ",
    description: `Select the type of restriction you wish to make`,
    imageUrl: `/images/Calendar/steps/selectRes.png`,
  },
  {
    stepNumber: 4,
    title: "New Restriction",
    description: `A new Restriction will be displayed, fill in the details and save to add it permanently`,
    imageUrl: `/images/Calendar/steps/newrestriction.png`,
  },
  {
    stepNumber: 5,
    title: "View Restrictions",
    description: `All restrictions will be displayed below`,
    imageUrl: `/images/Calendar/steps/viewRes.png`,
  },
  {
    stepNumber: 6,
    title: "Save Changes",
    description: `Click on the icon to Save Changes made to restrictions`,
    imageUrl: `/images/Calendar/steps/save.png`,
  },
  {
    stepNumber: 7,
    title: "Delete Restriction",
    description: `Click on the icon to delete restrictions`,
    imageUrl: `/images/Calendar/steps/delete.png`,
  },
];

export const calendarSection: HelpPageSection = {
  id: "calendar",
  title: "Calendar",
  description: "Manage calendar views and schedule restrictions",
  pageName: "Calendar Page",
  pageImage: {
    url: "/images/Calendar/image.png",
  },
  roles: ["all"],
  steps: calendarSteps,
};
