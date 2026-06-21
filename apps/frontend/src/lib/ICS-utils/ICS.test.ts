import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { generateICS } from "./ICS";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";

function formatBegin(): string[] {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//UMTAS//Schedule//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push("X-WR-TIMEZONE:Africa/Johannesburg");

  return lines;
}
function formatEnd(): string[] {
  const lines: string[] = [];
  lines.push("END:VCALENDAR");
  return lines;
}
function formatEventchanges(
  events: EventResponse[],
  modules: ModuleResponseDto[],
): string[] {
  const lines: string[] = [];
  for (const event of events) {
    const criteria = event.event.eventCriteria;
    if (!criteria?.day || !criteria?.startTime || !criteria?.endTime) {
      continue;
    }

    const lectureModule = modules.find(
      (m) => m.moduleID === event.lecture?.moduleID,
    );
    const moduleName = lectureModule ? lectureModule.moduleName : "";
    const dateStr = criteria.day.replace(/-/g, "");
    const startStr = criteria.startTime.replace(":", "") + "00";
    const endStr = criteria.endTime.replace(":", "") + "00";
    const uid = event.event.eventID + "@umtas.vigil";
    const isRecurring = false; // Temporarily disabled

    lines.push("BEGIN:VEVENT");
    lines.push("UID:" + uid);
    lines.push("DTSTART;TZID=Africa/Johannesburg:" + dateStr + "T" + startStr);
    lines.push("DTEND;TZID=Africa/Johannesburg:" + dateStr + "T" + endStr);
    lines.push("SUMMARY:" + (criteria.moduleCode || "Event"));
    lines.push(
      "DESCRIPTION:" +
        (criteria.moduleCode || "") +
        (moduleName ? " - " + moduleName : ""),
    );

    if (isRecurring) {
      lines.push("RRULE:FREQ=WEEKLY");
    }

    lines.push("END:VEVENT");
  }
  return lines;
}

describe("Unit Tests for ICS", () => {
  beforeAll(() => {});
  beforeEach(() => {});

  it("Correct setup no modules no events", () => {
    const lines = [...formatBegin(), ...formatEnd()];
    const testResult = lines.join("\r\n");
    const funcResult = generateICS([], []);
    expect(testResult === funcResult).toBe(true);
  });
});
