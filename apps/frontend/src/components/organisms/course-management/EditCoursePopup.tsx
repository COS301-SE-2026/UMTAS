"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Card } from "@/components/atoms/baseShadcn/card";
import Popup from "@/components/atoms/utility/floatContainer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteCourseQ,
  updateCourseQ,
} from "@/app/course-management/queries/courses/courseQueries";
import { X } from "lucide-react";

interface EditCoursePopupProps {
  onClose: () => void;
  courseId: string;
  initialCourseName: string;
  initialDegreeName: string;
}

export function EditCoursePopup({
  onClose,
  courseId,
  initialCourseName,
  initialDegreeName,
}: EditCoursePopupProps) {
  const [courseName, setCourseName] = useState(initialCourseName);
  const [degreeName, setDegreeName] = useState(initialDegreeName);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const {
    mutate: updateCourse,
    isPending,
    isError,
  } = useMutation(updateCourseQ());

  const {
    mutate: deleteCourse,
    isPending: deletePending,
    isError: deleteError,
  } = useMutation(deleteCourseQ());

  function handleDelete() {
    if (!courseName.trim()) {
      return;
    }
    deleteCourse(
      {
        CourseId: courseId,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Course successfully deleted!");
          queryClient.invalidateQueries({ queryKey: ["courses"] });
          setTimeout(() => {
            onClose();
          }, 1000);
        },
      },
    );
  }

  function handleSave() {
    if (!courseName.trim()) {
      return;
    }

    updateCourse(
      {
        path: { CourseId: courseId },
        body: {
          CourseName: courseName,
          Degree: degreeName === "" ? undefined : degreeName,
        },
      },
      {
        onSuccess: () => {
          setSuccessMessage("Course successfully updated!");
          queryClient.invalidateQueries({ queryKey: ["courses"] });
          setTimeout(() => {
            onClose();
          }, 1000);
        },
      },
    );
  }

  const isBusy = isPending || deletePending || !!successMessage;

  return (
    <Popup>
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <Card className="relative w-full max-w-md p-6 flex flex-col gap-4 border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={isBusy}
            className="absolute top-2 right-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Edit Course
          </h2>

          {successMessage && (
            <div className="p-3 text-sm text-[var(--success-text)] bg-[var(--success-bg)] rounded-md text-center font-medium">
              {successMessage}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="course-name">Course Name</Label>
            <Input
              data-testid="course-name-input"
              id="course-name"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Blommerangskikking"
              disabled={isBusy}
              className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)] mb-4"
            />
            <Label htmlFor="degree-name">Degree Name</Label>
            <Input
              data-testid="degree-name-input"
              id="degree-name"
              value={degreeName}
              onChange={(e) => setDegreeName(e.target.value)}
              placeholder="e.g. BA Inkleur"
              disabled={isBusy}
              className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]"
            />
          </div>

          <div className="flex justify-center gap-3 mt-4">
            <Button
              data-testid="edit-course-confirm"
              onClick={handleSave}
              disabled={!courseName.trim() || isBusy}
              className={
                isError ? "bg-[var(--error-bg)] text-[var(--error-text)]" : ""
              }
            >
              {isPending
                ? "Updating..."
                : isError
                  ? "Failed to Update"
                  : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={!courseName.trim() || isBusy}
              className={
                deleteError
                  ? "bg-[var(--error-bg)] text-[var(--error-text)]"
                  : ""
              }
            >
              {deletePending
                ? "Deleting..."
                : deleteError
                  ? "Failed to Delete"
                  : "Delete Course"}
            </Button>
          </div>
        </Card>
      </div>
    </Popup>
  );
}
