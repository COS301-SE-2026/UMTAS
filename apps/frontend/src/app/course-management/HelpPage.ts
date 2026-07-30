import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const courseSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "View all Courses",
    description: `See all the Courses at your institute.`,
  },
  {
    stepNumber: 2,
    title: "Search/Filter for a certain courses/s",
    description: `To search or filter for certain courses, use the search boc and filter dropdowns.`,
  },
  {
    stepNumber: 3,
    title: "Create a Course",
    description: `To create a course, click the 'Add Course' button, fill in the relative fields, and click 'Create Course'.`,
  },
  {
    stepNumber: 4,
    title: `View a Course's modules`,
    description: `To view the modules belonging to a Course, click the 'View Modules' button in the same row as the respective Course.`,
  },
];

export const courseSection: HelpPageSection = {
  id: "course-management",
  title: "Course Management",
  description: "View, filter and edit courses as an admin.",
  pageName: "Course Page",
  pageImage: {
    url: "/images/CourseManagement/image.png",
    //altText: "course image",
  },
  roles: ["all"],
  steps: courseSteps,
};
