"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { useMutation } from "@tanstack/react-query";
import { updateCourseQ } from "@/app/course-management/queries/courses/courseQueries";
import { CourseDTO } from "@/app/course-management/queries/courses/courseBuilder";

export default function EditCourse({
  course,
  onClose,
}: {
  course: CourseDTO;
  onClose: () => void;
}) {
  const [courseName, setCourseName] = useState(course.CourseName || "");
  const [degree, setDegree] = useState(course.Degree || "");

  const updateMut = useMutation(updateCourseQ());

  const handleUpdate = () => {
    updateMut.mutate(
      {
        path: { CourseId: course.CourseID },
        body: { CourseName: courseName, Degree: degree },
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-sm w-full max-w-md mx-auto">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Edit Course
      </h2>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Course Name
        </label>
        <Input
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]"
          placeholder="e.g. Introduction to Computer Science"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Degree
        </label>
        <Input
          value={degree}
          onChange={(e) => setDegree(e.target.value)}
          className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]"
          placeholder="e.g. Bachelor of Science"
        />
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border)]">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={updateMut.isPending}
          className="bg-[var(--background)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)]"
        >
          Cancel
        </Button>
        <Button onClick={handleUpdate} disabled={updateMut.isPending}>
          {updateMut.isPending ? "Saving" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
