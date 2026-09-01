import type { GeneratedCalendarPayloadDto } from "./types";

export const calendarFixture: GeneratedCalendarPayloadDto = {
  name: "Engineering, 2026; Calendar",
  year: 2026,
  recurringEvents: [
    {
      key: "event-series-1",
      title: "Algorithms, Seminars; βeta",
      description: "Bring notes\\draft\nSecond line",
      location: "IT, 4-1; North",
      moduleId: "module-1",
      moduleColour: "#4A90F8",
      startTime: "08:30",
      endTime: "09:20",
      weekday: "MONDAY",
      startsOn: "2026-02-02",
      endsOn: "2026-06-22",
      excludedDates: ["2026-03-30"],
      additionalDates: ["2026-04-03"],
    },
  ],
  oneOffEvents: [
    {
      key: "event-exam-1",
      title: "Final exam",
      location: "Hall A",
      date: "2026-06-15",
      startTime: "09:00",
      endTime: "12:00",
    },
  ],
  allDayEvents: [
    {
      key: "restriction-recess-1",
      title: "Mid-year recess",
      description: "University recess",
      type: "RECESS",
      startDate: "2026-06-27",
      endDate: "2026-07-05",
    },
  ],
  warnings: [{ code: "TEST_WARNING", message: "This must not be exported" }],
};
