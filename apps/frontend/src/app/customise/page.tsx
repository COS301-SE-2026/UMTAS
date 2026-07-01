"use client";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import CustomiseShell from "@/components/templates/customise/CustomiseShell";

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
];

export default function Customise() {
  return <CustomiseShell events={mockEvents} modules={mockModules} />;
}
