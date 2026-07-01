"use client";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import CustomiseShell from "@/components/templates/customise/CustomiseShell";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from "@/components/atoms/customise/alert-dialog-customise";

//some mock data for the static pages
const mockModules: ModuleResponseDto[] = [
  {
    moduleID: "1",
    moduleCode: "COS301",
    moduleName: "Software Eng",
    styling: { colour: "" },
  },
  {
    moduleID: "2",
    moduleCode: "COS301",
    moduleName: "Software Eng",
    styling: { colour: "" },
  },
  {
    moduleID: "3",
    moduleCode: "COS301",
    moduleName: "Software Eng",
    styling: { colour: "" },
  },
  {
    moduleID: "4",
    moduleCode: "COS301",
    moduleName: "Software Eng",
    styling: { colour: "" },
  },
  {
    moduleID: "5",
    moduleCode: "COS301",
    moduleName: "Software Eng",
    styling: { colour: "" },
  },
  {
    moduleID: "6",
    moduleCode: "COS301",
    moduleName: "Software Eng",
    styling: { colour: "" },
  },
];
const mockEvents: EventResponse[] = [
  {
    isRecurring: false,
    eventID: "1",
    eventName: "COS301 Lecture 1",
    eventCode: "301-L1",
    eventCriteria: {
      date: "Monday",
      startTime: "08:30",
      endTime: "10:00",
      type: "university",
      moduleID: "COS301",
    },
  },
  {
    isRecurring: false,
    eventID: "2",
    eventName: "COS301 Lecture 1",
    eventCode: "301-L1",
    eventCriteria: {
      date: "Monday",
      startTime: "08:30",
      endTime: "10:00",
      type: "university",
      moduleID: "COS301",
    },
  },
  {
    isRecurring: false,
    eventID: "3",
    eventName: "COS301 Lecture 1",
    eventCode: "301-L1",
    eventCriteria: {
      date: "Monday",
      startTime: "08:30",
      endTime: "10:00",
      type: "university",
      moduleID: "COS301",
    },
  },
  {
    isRecurring: false,
    eventID: "4",
    eventName: "COS301 Lecture 1",
    eventCode: "301-L1",
    eventCriteria: {
      date: "Monday",
      startTime: "08:30",
      endTime: "10:00",
      type: "university",
      moduleID: "COS301",
    },
  },
  {
    isRecurring: false,
    eventID: "5",
    eventName: "COS302 Lecture 1",
    eventCode: "301-L1",
    eventCriteria: {
      date: "Monday",
      startTime: "08:30",
      endTime: "10:00",
      type: "university",
      moduleID: "COS301",
    },
  },
  {
    isRecurring: false,
    eventID: "6",
    eventName: "COS301 Lecture 1",
    eventCode: "301-L1",
    eventCriteria: {
      date: "Monday",
      startTime: "08:30",
      endTime: "10:00",
      type: "university",
      moduleID: "COS301",
    },
  },
];

export default function Customise() {
  return (
    <div className="p-8">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Open Customise Settings</Button>
        </AlertDialogTrigger>

        <AlertDialogContent className="w-max max-w-[95vw] p-6">
          <AlertDialogHeader className="flex flex-row justify-between items-center border-b pb-2">
            <AlertDialogTitle className="text-xl font-bold">
              Customise Panel
            </AlertDialogTitle>
            <AlertDialogCancel className="mt-0">Close</AlertDialogCancel>
          </AlertDialogHeader>

          <div className="py-4 overflow-auto max-h-[80vh]">
            <CustomiseShell events={mockEvents} modules={mockModules} />
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
