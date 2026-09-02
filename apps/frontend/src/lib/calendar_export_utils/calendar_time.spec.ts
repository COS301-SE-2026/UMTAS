import {
  addDays,
  buildVTimezone,
  buildWeeklyRrule,
  getUtcOffsetMinutes,
  localToUtcBasic,
  toBasicDate,
  toBasicDateTime,
  weekdayToIcalCode,
} from "./calendar_time";

describe("calendar_time", () => {
  it("gets offsets for fixed and daylight-saving zones", () => {
    expect(
      getUtcOffsetMinutes(
        "Africa/Johannesburg",
        new Date("2026-01-15T12:00:00Z"),
      ),
    ).toBe(120);
    expect(
      getUtcOffsetMinutes("Europe/London", new Date("2026-01-15T12:00:00Z")),
    ).toBe(0);
    expect(
      getUtcOffsetMinutes("Europe/London", new Date("2026-07-15T12:00:00Z")),
    ).toBe(60);
    expect(
      getUtcOffsetMinutes("America/New_York", new Date("2026-01-15T12:00:00Z")),
    ).toBe(-300);
    expect(
      getUtcOffsetMinutes("America/New_York", new Date("2026-07-15T12:00:00Z")),
    ).toBe(-240);
  });

  it("converts local wall-clock times and recurrence UNTIL to UTC", () => {
    expect(localToUtcBasic("Africa/Johannesburg", "2026-02-02", "08:30")).toBe(
      "20260202T063000Z",
    );
    expect(localToUtcBasic("Europe/London", "2026-06-22", "08:30")).toBe(
      "20260622T073000Z",
    );
    expect(
      buildWeeklyRrule({
        weekday: "MONDAY",
        endsOn: "2026-06-22",
        startTime: "08:30",
        tzid: "Europe/London",
      }),
    ).toBe("FREQ=WEEKLY;BYDAY=MO;UNTIL=20260622T073000Z");
  });

  it("formats basic values and maps weekdays", () => {
    expect(toBasicDate("2026-04-27")).toBe("20260427");
    expect(toBasicDateTime("2026-02-02", "08:30")).toBe("20260202T083000");
    expect(weekdayToIcalCode("MONDAY")).toBe("MO");
    expect(weekdayToIcalCode("SUNDAY")).toBe("SU");
  });

  it("adds days across month and leap-day boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
  });

  it("emits a single fixed-offset observance for SAST", () => {
    expect(buildVTimezone("Africa/Johannesburg", 2026, 2026)).toEqual([
      "BEGIN:VTIMEZONE",
      "TZID:Africa/Johannesburg",
      "BEGIN:STANDARD",
      "DTSTART:20260101T000000",
      "TZOFFSETFROM:+0200",
      "TZOFFSETTO:+0200",
      "END:STANDARD",
      "END:VTIMEZONE",
    ]);
  });

  it("emits both London transitions for each requested year", () => {
    const lines = buildVTimezone("Europe/London", 2025, 2026);
    expect(lines.filter((line) => line === "BEGIN:DAYLIGHT")).toHaveLength(2);
    expect(lines.filter((line) => line === "BEGIN:STANDARD")).toHaveLength(2);
    expect(lines).toContain("TZID:Europe/London");
    expect(lines).toContain("TZOFFSETFROM:+0000");
    expect(lines).toContain("TZOFFSETTO:+0100");
    expect(lines).toContain("TZOFFSETFROM:+0100");
    expect(lines).toContain("TZOFFSETTO:+0000");
  });

  it("does not depend on the runtime's default locale or numbering system", () => {
    const RealDateTimeFormat = Intl.DateTimeFormat;
    const spy = jest
      .spyOn(Intl, "DateTimeFormat")
      .mockImplementation(
        (locales, options) =>
          new RealDateTimeFormat(locales ?? "ar-EG-u-nu-arab", options),
      );

    expect(
      getUtcOffsetMinutes("Asia/Tokyo", new Date("2026-01-15T12:00:00Z")),
    ).toBe(540);
    expect(spy).toHaveBeenCalledWith(
      "en-US-u-ca-gregory-nu-latn",
      expect.objectContaining({ timeZone: "Asia/Tokyo" }),
    );
    spy.mockRestore();
  });

  it("handles DST transition boundaries explicitly", () => {
    expect(() =>
      localToUtcBasic("America/New_York", "2026-03-08", "02:30"),
    ).toThrow(/does not exist/);
    expect(localToUtcBasic("America/New_York", "2026-11-01", "01:30")).toBe(
      "20261101T053000Z",
    );
  });

  it.each([
    ["2026-02-29", "08:30"],
    ["2026-13-01", "08:30"],
    ["2026-01-01", "24:00"],
    ["2026-01-01", "12:60"],
  ])("rejects invalid date/time input %s %s", (date, time) => {
    expect(() => toBasicDateTime(date, time)).toThrow(RangeError);
  });

  it("rejects unknown time zones", () => {
    expect(() =>
      getUtcOffsetMinutes("Not/A_Timezone", new Date("2026-01-01T00:00:00Z")),
    ).toThrow(RangeError);
  });
});
