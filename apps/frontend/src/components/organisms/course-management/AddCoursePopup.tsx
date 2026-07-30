"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Card } from "@/components/atoms/baseShadcn/card";
import Popup from "@/components/atoms/utility/floatContainer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCourseQ } from "@/app/course-management/queries/courses/courseQueries";
import { UserDetails } from "@/lib/userclass/userClass";

interface AddCoursePopupProps {
  onClose: () => void;
}

export function AddCoursePopup({ onClose }: AddCoursePopupProps) {
  const [courseName, setCourseName] = useState("");
  const [degreeName, setDegreeName] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const {
    mutate: createCourse,
    isPending,
    isError,
  } = useMutation(createCourseQ());

  function handleSave() {
    if (!courseName.trim()) {
      return;
    }
    createCourse(
      {
        CourseName: courseName,
        UniversityID: UserDetails.getUniDetails()?.UniversityID ?? "",
        Degree: degreeName,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Course successfully created!");
          queryClient.invalidateQueries({ queryKey: ["courses"] });
          setTimeout(() => {
            onClose();
          }, 1000);
        },
      },
    );
  }

  return (
    <Popup>
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 flex flex-col gap-4 border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Create New Course
          </h2>

          {successMessage && (
            <div className="p-3 text-sm text-[var(--success-text)] bg-[var(--success-bg)] rounded-md text-center font-medium">
              {successMessage}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {/* willie put me on that id grindd */}
            <Label htmlFor="course-name">Course Name</Label>
            <Input
              id="course-name"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Blommerangskikking"
              disabled={isPending || !!successMessage}
              className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)] mb-4"
            />
            <Label htmlFor="degree-name">Degree Name</Label>
            <Input
              id="degree-name"
              value={degreeName}
              onChange={(e) => setDegreeName(e.target.value)}
              placeholder="e.g. BA Inkleur"
              disabled={isPending || !!successMessage}
              className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isPending || !!successMessage}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!courseName.trim() || isPending || !!successMessage}
              className={
                isError ? "bg-[var(--error-bg)] text-[var(--error-text)]" : ""
              }
            >
              {isPending
                ? "Creating..."
                : isError
                  ? "Failed to Create"
                  : "Create Course"}
            </Button>
          </div>
        </Card>
      </div>
    </Popup>
  );
}
