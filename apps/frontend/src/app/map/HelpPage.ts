import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const mapSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "Route",
    description: `If you have an event at the selected time you will be routed to the event automatically`,
    imageUrl: `/images/Map/steps/timeroute.png`,
  },
  {
    stepNumber: 2,
    title: "Heatmap",
    description: `Click on the heatmap tab to view the institute heatmap `,
    imageUrl: `/images/Map/steps/ViewHeatmap.png`,
  },
  {
    stepNumber: 3,
    title: "Heatmap Settings",
    description: `On the heatmaps tab Settings can be altered for specific ranges`,
    imageUrl: `/images/Map/steps/heatmapSettings.png`,
  },
  {
    stepNumber: 4,
    title: "Create Buildings",
    description: `As a university admin you can pin and create building outlines`,
    imageUrl: `/images/Map/steps/createBuidings.png`,
  },
  {
    stepNumber: 5,
    title: "Rerouting Students",
    description: `As a university admin you can reroute congested paths for alternate routes`,
    imageUrl: `/images/Map/steps/RerouteStudents.png`,
  },
];

export const mapSection: HelpPageSection = {
  id: "map",
  title: "Map",
  description: "View Mapping data for your university",
  pageName: "Maps",
  pageImage: {
    url: "/images/Map/image.png",
  },
  roles: ["all"],
  steps: mapSteps,
};
