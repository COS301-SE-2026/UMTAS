import ICAL from "ical.js";
import { calendarFixture } from "./test_fixture";
import { downloadICS, generateAcademicCalendarICS } from "./ics_export";

const NOW = new Date("2026-01-10T12:34:56.000Z");

function unfold(content: string): string {
  return content.replace(/\r\n /g, "");
}

describe("generateAcademicCalendarICS", () => {
  it("assembles literal RFC 5545 properties for every event bucket", () => {
    const content = unfold(
      generateAcademicCalendarICS(calendarFixture, "Africa/Johannesburg", NOW),
    );

    expect(content).toContain(
      "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//UMTAS//Academic Calendar//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n",
    );
    expect(content).toContain("TZID:Africa/Johannesburg\r\n");
    expect(content).toContain("DTSTAMP:20260110T123456Z\r\n");
    expect(content).toContain(
      "RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20260622T063000Z\r\n",
    );
    expect(content).toContain(
      "EXDATE;TZID=Africa/Johannesburg:20260330T083000\r\n",
    );
    expect(content).toContain(
      "RDATE;TZID=Africa/Johannesburg:20260403T083000\r\n",
    );
    expect(content).toContain("DTSTART;VALUE=DATE:20260627\r\n");
    expect(content).toContain("DTEND;VALUE=DATE:20260706\r\n");
    expect(content).not.toContain("TEST_WARNING");
    expect(content.match(/STATUS:CONFIRMED/g)).toHaveLength(3);
    expect(content.match(/SEQUENCE:0/g)).toHaveLength(3);
  });

  it("escapes text exactly once and omits absent optional properties", () => {
    const content = unfold(
      generateAcademicCalendarICS(calendarFixture, "Africa/Johannesburg", NOW),
    );
    expect(content).toContain("SUMMARY:Algorithms\\, Seminars\\; βeta\r\n");
    expect(content).toContain(
      "DESCRIPTION:Bring notes\\\\draft\\nSecond line\r\n",
    );
    expect(content).toContain("LOCATION:IT\\, 4-1\\; North\r\n");
    expect(content).not.toContain("Algorithms\\\\,");

    const exam = content.slice(
      content.indexOf("UID:event-exam-1@umtas.vigil"),
      content.indexOf(
        "END:VEVENT",
        content.indexOf("UID:event-exam-1@umtas.vigil"),
      ),
    );
    expect(exam).not.toContain("DESCRIPTION:");
  });

  it("uses CRLF only", () => {
    const content = generateAcademicCalendarICS(
      calendarFixture,
      "Africa/Johannesburg",
      NOW,
    );
    expect(content).toMatch(/\r\n$/);
    expect(content.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("folds at 75 UTF-8 octets without splitting a multibyte character", () => {
    const payload = {
      ...calendarFixture,
      recurringEvents: [],
      allDayEvents: [],
      oneOffEvents: [
        {
          ...calendarFixture.oneOffEvents[0],
          title: `${"a".repeat(63)}é${"b".repeat(20)}`,
        },
      ],
    };
    const content = generateAcademicCalendarICS(
      payload,
      "Africa/Johannesburg",
      NOW,
    );
    const physicalLines = content.split("\r\n");
    const summaryIndex = physicalLines.findIndex((line) =>
      line.startsWith("SUMMARY:"),
    );
    expect(physicalLines[summaryIndex]).toBe(`SUMMARY:${"a".repeat(63)}ébb`);
    expect(physicalLines[summaryIndex + 1]).toBe(` ${"b".repeat(18)}`);
    for (const line of physicalLines.filter(Boolean)) {
      expect(new Blob([line]).size).toBeLessThanOrEqual(75);
    }
  });

  it("creates a valid empty calendar", () => {
    const content = generateAcademicCalendarICS(
      {
        name: "Empty",
        year: 2026,
        recurringEvents: [],
        oneOffEvents: [],
        allDayEvents: [],
        warnings: [],
      },
      "Africa/Johannesburg",
      NOW,
    );
    expect(content).toContain("BEGIN:VTIMEZONE\r\n");
    expect(content).not.toContain("BEGIN:VEVENT");
    expect(content.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("can be imported by an independent iCalendar parser", () => {
    const content = generateAcademicCalendarICS(
      calendarFixture,
      "Africa/Johannesburg",
      NOW,
    );
    const calendar = new ICAL.Component(ICAL.parse(content));
    const parsedEvents = calendar.getAllSubcomponents("vevent");

    expect(calendar.name).toBe("vcalendar");
    expect(calendar.getAllSubcomponents("vtimezone")).toHaveLength(1);
    expect(parsedEvents).toHaveLength(3);
    expect(parsedEvents[0].getFirstPropertyValue("uid")).toBe(
      "event-series-1@umtas.vigil",
    );
    expect(parsedEvents[0].getFirstPropertyValue("summary")).toBe(
      "Algorithms, Seminars; βeta",
    );
    expect(parsedEvents[0].getFirstPropertyValue("rrule")).toBeDefined();
  });

  it("rejects invalid payload values and duplicate keys before serializing", () => {
    expect(() =>
      generateAcademicCalendarICS(
        {
          ...calendarFixture,
          oneOffEvents: [
            {
              ...calendarFixture.oneOffEvents[0],
              date: "2026-02-30",
            },
          ],
        },
        "Africa/Johannesburg",
        NOW,
      ),
    ).toThrow(/Invalid calendar date/);

    expect(() =>
      generateAcademicCalendarICS(
        {
          ...calendarFixture,
          oneOffEvents: [
            {
              ...calendarFixture.oneOffEvents[0],
              key: calendarFixture.recurringEvents[0].key,
            },
          ],
        },
        "Africa/Johannesburg",
        NOW,
      ),
    ).toThrow(/Duplicate calendar event key/);
  });
});

describe("downloadICS", () => {
  it("clicks an attached anchor and revokes the object URL asynchronously", () => {
    jest.useFakeTimers();
    const createObjectURL = jest.fn(() => "blob:calendar");
    const revokeObjectURL = jest.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {
        expect(
          document.querySelector('a[href="blob:calendar"]'),
        ).not.toBeNull();
      });

    downloadICS("BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n", "academic.ics");

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[href="blob:calendar"]')).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:calendar");
    click.mockRestore();
    jest.useRealTimers();
  });
});
