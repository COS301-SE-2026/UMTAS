import { Button } from "@/components/atoms/baseShadcn/button";
import { Card } from "@/components/atoms/baseShadcn/card";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Spinner } from "@/components/atoms/baseShadcn/spinner";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  APIServiceCoursesResp,
  APIserviceModulesResp,
  fetchAllEvents,
  fetchAllModules,
  fetchAPIserviceCourses,
  fetchAPIserviceModules,
  moduleResponseType,
} from "./Queries/request";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { getAllCoursesQ } from "@/app/course-management/queries/courses/courseQueries";
import { moduleDTO } from "@/app/course-management/queries/modules/moduleBuilder";

export function ExternalCoursesPopup() {
  const [numPages, setNumPages] = useState(0);
  const [limit, setLimit] = useState(1);

  const { mutateAsync: getCourses, isPending: pendingCourses } = useMutation({
    mutationFn: () =>
      fetchAPIserviceCourses({
        limit: limit,
        page: numPages,
      }),
    onSuccess: (successData) => {
      getQueryClient().invalidateQueries({
        queryKey: getAllCoursesQ().queryKey,
      });
      getModules(successData);
    },
  });

  const { mutateAsync: getModules, isPending: pendingModules } = useMutation({
    mutationFn: (coursesToFetch: APIServiceCoursesResp["courses"]) =>
      fetchAllModules(coursesToFetch),
    onSuccess: (successData) => {
      getEvents(successData);
    },
  });

  const { mutate: getEvents, isPending: pendingEvents } = useMutation({
    mutationFn: async (data: APIserviceModulesResp["modules"]) =>
      fetchAllEvents(data),
  });

  return (
    <Card className="w-full max-w-md p-6 flex flex-col gap-4 border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Fetch courses
      </h2>

      <div className="flex flex-col gap-2">
        <Label htmlFor="course pages">Number of pages</Label>
        <Input
          data-testid="course-Page-input"
          id="course-page"
          value={numPages}
          onChange={(e) => {
            setNumPages(Number(e.target.value));
          }}
          min={0}
          max={100}
          type="number"
          placeholder="0"
          disabled={pendingCourses || pendingModules || pendingEvents}
          className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)] mb-4"
        />
        <Label htmlFor="number of courses">Number of results</Label>
        <Input
          data-testid="course-number-input"
          id="course-number-input"
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
          }}
          placeholder="0"
          disabled={pendingCourses || pendingModules || pendingEvents}
          min={1}
          max={10}
          type="number"
          className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]"
        />
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <Button
          data-testid="add-course-confirm"
          onClick={async () => {
            await getCourses();
          }}
          disabled={pendingCourses || pendingModules || pendingEvents}
          className={
            false ? "bg-[var(--error-bg)] text-[var(--error-text)]" : ""
          }
        >
          {pendingCourses || pendingModules || pendingEvents ? (
            <div className="flex flex-row gap-x-3">
              <Spinner></Spinner> fetching courses
            </div>
          ) : (
            "Fetch External Courses"
          )}
        </Button>
      </div>
    </Card>
  );
}
