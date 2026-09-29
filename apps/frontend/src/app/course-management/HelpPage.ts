import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const courseSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "View all Courses",
    description: `See all the Courses at your institute.`,
    imageUrl: "/images/CourseManagement/image.png",
  },
  {
    stepNumber: 2,
    title: "Filter Courses",
    description: `Filter through courses at your institute`,
    imageUrl: "/images/CourseManagement/steps/filter.png",
  },
  {
    stepNumber: 3,
    title: "View Course Modules",
    description: `Click on View Modules to see a courses Modules`,
    imageUrl: "/images/CourseManagement/steps/ViewMods.png",
  },
  {
    stepNumber: 4,
    title: "Modules will be listed below",
    description: ``,
    imageUrl: "/images/CourseManagement/steps/dispmods.png",
  },
  {
    stepNumber: 5,
    title: "Enroll into a course",
    description: `As a student you can enroll into a specific course`,
    imageUrl: "/images/CourseManagement/steps/enroll.png",
  },
  {
    stepNumber: 6,
    title: "Enroll into a course",
    description: `You may only be enrolled into one course at a time`,
    imageUrl: "/images/CourseManagement/steps/onlyEnrollOne.png",
  },
  {
    stepNumber: 7,
    title: "Add Course",
    description: `As a university admin, click on add course to add a course`,
    imageUrl: "/images/CourseManagement/steps/addcourse.png",
  },
  {
    stepNumber: 8,
    title: "Add Course",
    description: `Enter the details of the new Course`,
    imageUrl: "/images/CourseManagement/steps/dispAddCourse.png",
  },
  {
    stepNumber: 9,
    title: "Edit Course",
    description: `Click Edit, to edit a course`,
    imageUrl: "/images/CourseManagement/steps/editsdet.png",
  },
  {
    stepNumber: 10,
    title: "Edit Course",
    description: ``,
    imageUrl: "/images/CourseManagement/steps/dispEdit.png",
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
