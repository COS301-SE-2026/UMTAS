"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/baseShadcn/tabs";
import { useMutation } from "@tanstack/react-query";

import {
  getAllModCoursesQ,
  updateModQ,
  updateModStylingQ,
} from "@/app/course-management/queries/modules/moduleQueries";
import { updateEventMut } from "@/components/templates/builder/Queries/eventQueries";

import { ModuleTableData } from "@/components/organisms/module-management/ModuleColumns";
import { CustomiseModuleCard } from "@/components/molecules/customise/CustomiseModuleCard";
import { CustomiseEventCard } from "@/components/molecules/customise/CustomiseEventCard";
import { UserDetails } from "@/lib/userclass/userClass";
import {
  updateModStylingBody,
  updateModStylingPath,
  updateStylingBuilder,
} from "@/app/course-management/queries/modules/moduleBuilder";
import { CourseSelect } from "./selectedCourse";
import { CourseDTO } from "@/app/course-management/queries/courses/courseBuilder";
import { addModuleToCourseQ } from "@/app/course-management/queries/courses/courseQueries";
import { Card } from "@/components/atoms/baseShadcn/card";
import { Checkbox } from "@/components/atoms/baseShadcn/checkbox";
import {
  updateEnrollmentBody,
  updateEnrollmentBuilder,
  updateEnrollmentParam,
} from "./queries/moduleQueries";
import { getQueryClient } from "@/components/tanstack/getQueryClient";

export default function EditModuleEvent({
  data,
  onClose,
}: {
  data: ModuleTableData;
  onClose: () => void;
}) {
  const [moduleState, setModuleState] = useState(data.modules);
  const [eventsState, setEventsState] = useState(data.events);

  console.log(moduleState, "This is module state ");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<CourseDTO>({
    CourseID: "",
    CourseName: "",
    UniversityID: UserDetails.getUniDetails()?.UniversityID ?? "",
  });

  const updateModuleMutResult = useMutation({
    ...updateModQ(),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["Modules"],
      });
    },
  });
  const updateEventMutResult = useMutation({
    ...updateEventMut(),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["Modules"],
      });
    },
  });

  const {
    mutate: addModuleToCourseMut,
    isPending: isAdding,
    isSuccess: isAddSuccess,
    isError: isAddError,
    reset: resetAdd,
  } = useMutation(addModuleToCourseQ());

  const { mutate: updateEnrollment, isPending: enrollmentPending } =
    useMutation({
      mutationFn: (body: updateEnrollmentBody) =>
        new updateEnrollmentBuilder().send({
          body: body,
          paths: { moduleId: moduleState.moduleID },
        }),
      onSuccess: () => {
        getQueryClient().invalidateQueries({
          queryKey: ["Modules"],
        });
      },
    });

  const updateStylingMut = useMutation({
    mutationFn: async (vars: {
      body: updateModStylingBody;
      path: updateModStylingPath;
    }) => {
      const builder = new updateStylingBuilder();
      return builder.send({ body: vars.body, paths: vars.path });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["Modules"],
      });
    },
    onError: (err) => console.error("mutation failed", err),
  });

  const isPending =
    updateModuleMutResult.isPending || updateEventMutResult.isPending;

  const handleModuleUpdate = async (
    id: string,
    field: string,
    value: unknown,
  ) => {
    setModuleState((module) => {
      if (field === "styling") {
        return { ...module, styling: { colour: value as string } };
      }
      return { ...module, [field]: value };
    });
  };

  const handleEventUpdate = async (
    id: string,
    field: string,
    value: unknown,
  ) => {
    setEventsState((events) =>
      events.map((event) => {
        if (event.eventId === id) {
          const updateFields = [
            "startTime",
            "endTime",
            "moduleId",
            "date",
            "dayOfWeek",
            "venue",
          ];
          if (updateFields.includes(field)) {
            return {
              ...event,
              eventCriteria: { ...event.eventCriteria, [field]: value },
            };
          }
          return { ...event, [field]: value };
        }
        return event;
      }),
    );
  };

  const handleSave = async () => {
    setFeedback(null);
    try {
      if (UserDetails.getUniDetails()?.role === "UNIVERSITY_ADMIN") {
        await updateModuleMutResult.mutateAsync({
          path: {
            moduleId: moduleState.moduleID,
          },
          body: {
            moduleCode: moduleState.moduleCode,
            moduleName: moduleState.moduleName,
            moduleDescription: moduleState.moduleDescription || " ",
            styling: moduleState.styling,
          },
        });

        for (const event of eventsState) {
          await updateEventMutResult.mutateAsync({
            path: { id: event.eventId },
            body: {
              eventName: event.eventName,
              activityCode: event.activityCode,
              activityType: event.activityType,
              isRecurring: event.isRecurring,
              eventCriteria: event.eventCriteria,
            },
          });
        }
      } else {
        if (moduleState.styling)
          updateStylingMut.mutate({
            body: {
              styling: moduleState.styling,
            },
            path: {
              moduleId: moduleState.moduleID,
            },
          });
      }
      setFeedback({ type: "success", message: "Changes saved successfully!" });

      setTimeout(() => {
        onClose();
      }, 2001);
    } catch (error) {
      setFeedback({
        type: "error",
        message: "Changes failed to save. Try again?",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-sm w-full max-w-2xl mx-auto max-h-[91vh] overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Edit Module and Events
        </h2>
        <Button
          type="button"
          variant={"default"}
          onClick={onClose}
          aria-label="Close"
        >
          Close
        </Button>
      </div>

      <Tabs
        defaultValue="module"
        className="flex-1 overflow-hidden flex flex-col"
      >
        <TabsList className="w-full justify-start bg-[var(--bg-elevated)]">
          <TabsTrigger
            value="module"
            className="data-[state=active]:bg-[var(--background)]"
          >
            Module
          </TabsTrigger>
          <TabsTrigger
            value="events"
            className="data-[state=active]:bg-[var(--background)]"
          >
            Events ({eventsState.length})
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto mt-4 pr-2 flex flex-col gap-4">
          <TabsContent value="module" className="mt-0 flex flex-col gap-4">
            <CustomiseModuleCard
              module={moduleState}
              onUpdate={handleModuleUpdate}
            />
            <div className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
              <Label
                htmlFor="module-description-input"
                className="text-sm font-medium text-[var(--text-secondary)]"
              >
                Module Enrollment
              </Label>
              <Label
                htmlFor="module-description-input"
                className="text-sm font-medium text-[var(--text-secondary)]"
              >
                Enroll
                <Checkbox
                  checked={moduleState.Enrolled ?? false}
                  onCheckedChange={(checked) => {
                    setModuleState((mod) => ({
                      ...mod,
                      Enrolled: Boolean(checked),
                    }));
                    updateEnrollment({ enroll: Boolean(checked) });
                  }}
                />
              </Label>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
              <Label
                htmlFor="module-description-input"
                className="text-sm font-medium text-[var(--text-secondary)]"
              >
                Module Description
              </Label>
              <Input
                disabled={
                  !(
                    UserDetails.getUniDetails()?.role === "LECTURER" ||
                    UserDetails.getUniDetails()?.role === "UNIVERSITY_ADMIN"
                  )
                }
                id="module-description-input"
                value={moduleState.moduleDescription || ""}
                onChange={(e) =>
                  handleModuleUpdate(
                    moduleState.moduleID,
                    "moduleDescription",
                    e.target.value,
                  )
                }
                placeholder="Enter module description..."
                className="bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)]"
              />
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-0 flex flex-col gap-6">
            {eventsState.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-8">
                No events associated with this module.
              </p>
            ) : (
              eventsState.map((event) => (
                <CustomiseEventCard
                  key={event.eventId}
                  event={event}
                  modules={[moduleState]}
                  onUpdate={handleEventUpdate}
                />
              ))
            )}
          </TabsContent>
        </div>
      </Tabs>

      {UserDetails.getUniDetails()?.role !== "STUDENT" && (
        <Card className="w-full mt-2 p-4 border-[var(--border)] bg-[var(--bg-surface)] shadow-md">
          <Label className="text-sm font-medium text-[var(--text-primary)]">
            Add Module to Course
          </Label>
          <CourseSelect
            CourseState={selectedCourse}
            updateCourseState={setSelectedCourse}
          >
            <Button
              disabled={!selectedCourse.CourseID || isAdding || isAddSuccess}
              onClick={() => {
                resetAdd();
                addModuleToCourseMut({
                  body: { modules: [moduleState.moduleID] },
                  path: { CourseID: selectedCourse.CourseID },
                });
              }}
              className={`w-fit mt-4 ${
                isAddSuccess
                  ? "bg-[var(--success-bg)] text-[var(--success-text)]"
                  : isAddError
                    ? "bg-[var(--error-bg)] text-[var(--error-text)]"
                    : ""
              }`}
            >
              {isAdding
                ? "Adding.."
                : isAddSuccess
                  ? "Successfully Added Module to Course"
                  : isAddError
                    ? "Failed to Add Module To Course"
                    : "Add Module to Course"}
            </Button>
          </CourseSelect>
        </Card>
      )}

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border)]">
        <div className="flex-1">
          {feedback && (
            <p
              className={`text-sm font-medium ${
                feedback.type === "success"
                  ? "text-[var(--success-text)]"
                  : "text-[var(--error-text)]"
              }`}
            >
              {feedback.message}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="bg-[var(--background)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)]"
          >
            Cancel
          </Button>
          <Button
            data-testid="save-changes-btn"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "Saving" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
