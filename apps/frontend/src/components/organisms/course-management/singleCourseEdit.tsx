import {
  CourseDTO,
  createCourses,
  createCoursesBody,
} from "@/app/course-management/queries/courses/courseBuilder";
import {
  createCourseQ,
  updateCourseQ,
} from "@/app/course-management/queries/courses/courseQueries";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { UserDetails } from "@/lib/userclass/userClass";
import { useMutation } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

// a simple div that is given a course and lets a user update
interface StateHolder {
  course: CourseDTO;
  updateCourse: (key: keyof CourseDTO, value: string) => void;
}
export default function CourseCustimisation({
  data,
  children,
}: {
  data: CourseDTO;
  children?: ReactNode;
}) {
  const [course, setCourse] = useState<CourseDTO>(data);

  const { mutate } = useMutation(updateCourseQ());

  function updateCourse(key: keyof CourseDTO, value: string) {
    setCourse({
      ...course,
      [key]: value,
    });
  }

  return (
    <div className=" w-full m-3 justify-center flex flex-col items-center space-y-4">
      <h1>Edit course</h1>
      <CourseInput
        field={"CourseName"}
        state={{ course: course, updateCourse }}
      />
      <CourseInput field={"Degree"} state={{ course: course, updateCourse }} />
      <div className="flex flex-row items-center space-x-4">
        <Button
          onClick={() =>
            mutate({ body: course, path: { CourseId: course.CourseID } })
          }
        >
          Confirm
        </Button>
        {children}
      </div>
    </div>
  );
}

interface CourseInputProps {
  field: keyof CourseDTO;
  state: StateHolder;
}
interface StateHolder {
  course: CourseDTO;
  updateCourse: (key: keyof CourseDTO, value: string) => void;
}

function CourseInput({ field, state }: CourseInputProps) {
  return (
    <div className="flex flex-col w-1/2 space-y-1">
      <label className="text-sm font-medium text-white">{field}</label>
      <Input
        value={state.course[field] ?? ""}
        onChange={(e) => state.updateCourse(field, e.target.value)}
      />
    </div>
  );
}
