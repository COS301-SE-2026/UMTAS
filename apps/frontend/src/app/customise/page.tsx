"use client";
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import CustomiseShell from "@/components/organisms/customise/CustomiseShell";

//some mock data for the static pages
export const mockModules: ModuleResponseDto[] = [
  {
    moduleID: 1,
    userID: "yum1",
    moduleCode: "COS301",
    moduleName: "Software Eng",
    styling: "#0062ff",
  },
  {
    moduleID: 2,
    userID: "yum2",
    moduleCode: "COS332",
    moduleName: "Computer Networks",
    styling: "#00ffaa",
  },
  {
    moduleID: 3,
    userID: "yum3",
    moduleCode: "COS333",
    moduleName:
      "Memorise this work my dear student, then I will test you on something else",
    styling: "#ffa200",
  },
];

export const mockEvents: EventResponse[] = [
  {
    event: {
      eventID: 1,
      userID: "yum1",
      name: "COS301 Lecture 1",
      code: "301-L1",
      eventCriteria: {
        day: "Monday",
        startTime: "08:30",
        endTime: "10:00",
        type: "lecture",
        moduleCode: "COS301",
      },
    },
    lecture: {
      lectureID: 1,
      eventID: 1,
      moduleID: 1,
    },
  },
  {
    event: {
      eventID: 2,
      userID: "yum2",
      name: "Computer Networks Lecture",
      code: "333-L1",
      eventCriteria: {
        day: "Wednesday",
        startTime: "14:30",
        endTime: "17:30",
        type: "lecture",
        moduleCode: "COS333",
      },
    },
    lecture: {
      lectureID: 2,
      eventID: 2,
      moduleID: 2,
    },
  },
  {
    event: {
      eventID: 3,
      userID: "yum3",
      name: "Fail noob",
      code: "333-L1",
      eventCriteria: {
        day: "Friday",
        startTime: "11:30",
        endTime: "13:00",
        type: "lecture",
        moduleCode: "COS333",
      },
    },
    lecture: {
      lectureID: 3,
      eventID: 3,
      moduleID: 3,
    },
  },
];

export default function Customise() {
  return <CustomiseShell events={mockEvents} modules={mockModules} />;
}
