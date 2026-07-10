"use client";

import { CreateModuleBody } from "@/app/course-management/queries/modules/moduleBuilder";
import { CreateModuleMutAdmin } from "@/app/course-management/queries/modules/moduleQueries";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Card } from "@/components/atoms/baseShadcn/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { InputProps, StateInput } from "@/components/atoms/utility/stateInput";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CourseDTO } from "@/app/course-management/queries/courses/courseBuilder";
import { getAllCoursesQ } from "@/app/course-management/queries/courses/courseQueries";
import { UserDetails } from "@/lib/userclass/userClass";
import { Input } from "@/components/atoms/baseShadcn/input";

export default function CreateModuleAdmin() {
  const [course, updateCourse] = useState<CourseDTO>({
    CourseID: "",
    CourseName: "",
    UniversityID: "",
  });
  const [module, updateMod] = useState<CreateModuleBody>({
    moduleCode: "",
    moduleName: "",
    moduleDescription: "",
    CourseID: "", // -> this needs to be set by our standard
    styling: { colour: "FFFF" },
  });
  function UpdateState(field: keyof CreateModuleBody, value: string) {
    updateMod((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const { mutate: createModule } = useMutation(CreateModuleMutAdmin());

  return (
    <Card className="items-center w-full p-5 space-y-3">
      <h1 className="text-center text-2xl">Create Module</h1>
      <StateInput State={module} update={UpdateState} field="moduleCode" />
      <StateInput State={module} update={UpdateState} field={"moduleName"} />
      <StateInput
        State={module}
        update={UpdateState}
        field={"moduleDescription"}
        type="text-area"
      />
      <Input
        type="color"
        onChange={(e) =>
          updateMod((prev) => ({
            ...prev,
            styling: { colour: e.target.value ?? "" },
          }))
        }
      ></Input>
      <CourseSelect CourseState={course} updateCourseState={updateCourse} />
      <Button
        onClick={() => createModule({ ...module, CourseID: course.CourseID })}
      >
        create
      </Button>
    </Card>
  );
}

interface CourseSelectProps {
  CourseState: CourseDTO;
  updateCourseState: (value: CourseDTO) => void;
}
function CourseSelect<CourseDTO>({
  CourseState,
  updateCourseState,
}: CourseSelectProps) {
  const [searchName, UpdateSearchName] = useState<string>("");

  const {} = useQuery(getAllCoursesQ());
  const { data: courseData = [] } = useQuery(
    getAllCoursesQ(
      {
        universityId: UserDetails.getUniDetails()?.UniversityID ?? "",
      },
      // todo add filter for course name
    ),
  );

  return (
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
  );
}
