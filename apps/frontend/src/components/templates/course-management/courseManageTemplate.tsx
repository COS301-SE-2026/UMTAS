// this will house the data fetching overall
// Course management entails creating courses around a group of modules and applying metadata

import { getAllCoursesQ } from "@/app/course-management/queries/courses/courseQueries";
import { Spinner } from "@/components/atoms/baseShadcn/spinner";
import { courseCols } from "@/components/organisms/course-management/courseColumns";
import { CourseTable } from "@/components/organisms/course-management/courseTable";
import { useQuery } from "@tanstack/react-query";

// Will hold all the filters above the table, table is just an entity to hold data local usage

export default function CourseManagementTemplate() {
  const {
    data: courseData = [],
    isLoading,
    isError,
  } = useQuery(getAllCoursesQ());

  if (isLoading) {
    return (
      <div className="h-full w-full flex justify-center">
        <Spinner></Spinner>
      </div>
    );
  }

  if (isError) {
    return <div>Something went wrong :( </div>;
  }

  return <CourseTable columns={courseCols} data={[]}></CourseTable>;
}
