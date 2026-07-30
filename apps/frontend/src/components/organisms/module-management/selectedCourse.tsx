import { CourseDTO } from "@/app/course-management/queries/courses/courseBuilder";
import { getAllCoursesQ } from "@/app/course-management/queries/courses/courseQueries";
import { Input } from "@/components/atoms/baseShadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { UserDetails } from "@/lib/userclass/userClass";
import { useQuery } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

interface CourseSelectProps {
  CourseState: CourseDTO;
  updateCourseState: (value: CourseDTO) => void;
  children?: ReactNode;
}
export function CourseSelect({
  CourseState,
  updateCourseState,
  children,
}: CourseSelectProps) {
  const [searchName, UpdateSearchName] = useState<string>("");

  const { data: courseData = [] } = useQuery(
    getAllCoursesQ({
      UniversityID: UserDetails.getUniDetails()?.UniversityID ?? "",
      CourseName: searchName === "" ? undefined : searchName,
    }),
  );

  return (
    <div className="flex flex-col h-fit w-full">
      <div className="flex gap-4 w-full">
        <div className="flex-1 flex flex-col space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Search for course
          </label>
          <Input
            className="text-left"
            placeholder="Search for course"
            value={searchName}
            onChange={(e) => {
              UpdateSearchName(e.target.value);
            }}
          />
        </div>

        <div className="flex-1 flex flex-col space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Select Course
          </label>
          <Select
            value={CourseState.CourseID}
            onValueChange={(courseId) => {
              const course = courseData.find((c) => c.CourseID === courseId);
              if (course) updateCourseState(course);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courseData.map((course) => (
                <SelectItem key={course.CourseID} value={course.CourseID}>
                  {course.CourseName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {children}
    </div>
  );
}
