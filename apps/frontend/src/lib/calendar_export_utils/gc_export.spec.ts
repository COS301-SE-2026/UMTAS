/** @jest-environment node */

import type { calendar_v3 } from "@googleapis/calendar";
import { syncToGoogleCalendar, toGoogleCalendarEvents } from "./gc_export";
import { ensureUmtasCalendar } from "./gc_calendars";
import { calendarFixture } from "./test_fixture";

jest.setTimeout(30_000);

function response(status: number, body: unknown = {}): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    statusText: status === 500 ? "Internal Server Error" : "",
    headers: { "Content-Type": "application/json" },
  });
}

describe("toGoogleCalendarEvents", () => {
  it("maps recurring, one-off, and inclusive all-day events", () => {
    const events = toGoogleCalendarEvents(
      calendarFixture,
      "Africa/Johannesburg",
    );
    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({
      id: expect.stringMatching(/^[a-v0-9]{5,1024}$/),
      summary: "Algorithms, Seminars; βeta",
      description: "Bring notes\\draft\nSecond line",
      location: "IT, 4-1; North",
      colorId: "9",
      start: {
        dateTime: "2026-02-02T08:30:00",
        timeZone: "Africa/Johannesburg",
      },
      end: {
        dateTime: "2026-02-02T09:20:00",
        timeZone: "Africa/Johannesburg",
      },
      recurrence: [
        "RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20260622T063000Z",
        "EXDATE;TZID=Africa/Johannesburg:20260330T083000",
        "RDATE;TZID=Africa/Johannesburg:20260403T083000",
      ],
      extendedProperties: {
        private: {
          umtas: "1",
          umtasHash: expect.stringMatching(/^[a-f0-9]{16}$/),
        },
      },
    });
    expect(events[1]).not.toHaveProperty("description");
    expect(events[1]).not.toHaveProperty("colorId");
    expect(events[2]).toMatchObject({
      start: { date: "2026-06-27" },
      end: { date: "2026-07-06" },
    });
    expect(toGoogleCalendarEvents(calendarFixture)[0].id).toBe(events[0].id);
  });

  it("maps one-off module colours to Google event colours", () => {
    const [event] = toGoogleCalendarEvents(
      {
        ...calendarFixture,
        recurringEvents: [],
        allDayEvents: [],
        oneOffEvents: [
          { ...calendarFixture.oneOffEvents[0], moduleColour: "#22C55E" },
        ],
      },
      "Africa/Johannesburg",
    );

    expect(event.colorId).toBe("10");
  });

  it("satisfies the official Google Calendar event request contract", () => {
    const generated = toGoogleCalendarEvents(
      calendarFixture,
      "Africa/Johannesburg",
    );
    const contractEvents: calendar_v3.Schema$Event[] = generated;

    expect(contractEvents).toHaveLength(3);
    expect(contractEvents[0]).toMatchObject({
      id: expect.stringMatching(/^[a-v0-9]+$/),
      start: { timeZone: "Africa/Johannesburg" },
      recurrence: expect.arrayContaining([expect.stringMatching(/^RRULE:/)]),
      extendedProperties: { private: { umtas: "1" } },
    });
  });

  it("keeps very long deterministic keys distinct and within Google's limit", () => {
    const prefix = "same-prefix-".repeat(200);
    const payload = {
      ...calendarFixture,
      recurringEvents: [],
      allDayEvents: [],
      oneOffEvents: [
        { ...calendarFixture.oneOffEvents[0], key: `${prefix}a` },
        { ...calendarFixture.oneOffEvents[0], key: `${prefix}b` },
      ],
    };
    const [first, second] = toGoogleCalendarEvents(
      payload,
      "Africa/Johannesburg",
    );
    expect(first.id).toHaveLength(1024);
    expect(second.id).toHaveLength(1024);
    expect(first.id).not.toBe(second.id);
    expect(first.id).toMatch(/^[a-v0-9]+$/);
  });

  it("rejects duplicate event keys before issuing requests", () => {
    expect(() =>
      toGoogleCalendarEvents(
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
      ),
    ).toThrow(/Duplicate calendar event key/);
  });
});

describe("Google Calendar transport", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = async (input, init) => {
      const request =
        input instanceof Request ? input : new Request(input, init);
      const body = ["GET", "HEAD"].includes(request.method)
        ? undefined
        : await request.clone().text();
      return fetchMock(request.url, {
        method: request.method,
        headers: request.headers,
        signal: request.signal,
        ...(body ? { body } : {}),
      });
    };
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockExistingUmtasCalendar(): void {
    fetchMock.mockResolvedValueOnce(
      response(200, { items: [{ id: "umtas-calendar", summary: "UMTAS" }] }),
    );
  }

  it("reuses an existing UMTAS calendar or creates it when absent", async () => {
    fetchMock.mockResolvedValueOnce(
      response(200, { items: [{ id: "existing-id", summary: "UMTAS" }] }),
    );
    await expect(ensureUmtasCalendar("token")).resolves.toBe("existing-id");

    fetchMock
      .mockResolvedValueOnce(response(200, { items: [] }))
      .mockResolvedValueOnce(response(200, { id: "new-id" }));
    await expect(ensureUmtasCalendar("token")).resolves.toBe("new-id");
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(
      "https://www.googleapis.com/calendar/v3/calendars",
    );
    expect(fetchMock.mock.calls.at(-1)?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({
        summary: "UMTAS",
        timeZone: "Africa/Johannesburg",
      }),
    });
  });

  it("inserts all mapped events with bounded workers", async () => {
    fetchMock.mockResolvedValue(response(201, { id: "created" }));
    mockExistingUmtasCalendar();
    fetchMock.mockResolvedValueOnce(response(200, { items: [] }));
    await expect(
      syncToGoogleCalendar(calendarFixture, {
        accessToken: "token",
        timezone: "Africa/Johannesburg",
      }),
    ).resolves.toEqual({ created: 3, updated: 0, deleted: 0, failed: [] });
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(
      fetchMock.mock.calls
        .filter(([url]) => String(url).includes("/events"))
        .every(([url]) => String(url).includes("/calendars/umtas-calendar/")),
    ).toBe(true);
    expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe(
      "Bearer token",
    );
  });

  it("updates an existing deterministic event without a 409 round trip", async () => {
    fetchMock.mockImplementation((url: string, init: RequestInit) => {
      if (init.method === "GET") {
        const mapped = toGoogleCalendarEvents(
          calendarFixture,
          "Africa/Johannesburg",
        )[0];
        return Promise.resolve(
          response(200, {
            items: [
              {
                id: mapped.id,
                extendedProperties: { private: { umtasHash: "changed" } },
              },
            ],
          }),
        );
      }
      if (init.method === "PUT") return Promise.resolve(response(200));
      const event = JSON.parse(String(init.body)) as { summary: string };
      return Promise.resolve(response(201, { id: event.summary }));
    });

    mockExistingUmtasCalendar();
    await expect(
      syncToGoogleCalendar(calendarFixture, {
        accessToken: "token",
        timezone: "Africa/Johannesburg",
      }),
    ).resolves.toEqual({ created: 2, updated: 1, deleted: 0, failed: [] });
    const updateCall = fetchMock.mock.calls.find(
      ([, init]) => (init as RequestInit).method === "PUT",
    );
    expect(updateCall?.[0]).toMatch(/\/events\/[a-v0-9]+$/);
  });

  it("collects a persistent server failure while other events succeed", async () => {
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      if (init.method === "GET")
        return Promise.resolve(response(200, { items: [] }));
      const event = JSON.parse(String(init.body)) as { summary: string };
      return Promise.resolve(
        event.summary === calendarFixture.oneOffEvents[0].title
          ? response(500, { error: { message: "backend unavailable" } })
          : response(201),
      );
    });

    mockExistingUmtasCalendar();
    await expect(
      syncToGoogleCalendar(calendarFixture, {
        accessToken: "token",
        timezone: "Africa/Johannesburg",
      }),
    ).resolves.toEqual({
      created: 2,
      updated: 0,
      deleted: 0,
      failed: [
        { key: "event-exam-1", status: 500, message: "backend unavailable" },
      ],
    });
    expect(
      fetchMock.mock.calls.filter(([, init]) =>
        String((init as RequestInit).body).includes("Final exam"),
      ),
    ).toHaveLength(7);
  });

  it("records a non-authentication 403 as a per-event failure", async () => {
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      if (init.method === "GET")
        return Promise.resolve(response(200, { items: [] }));
      const event = JSON.parse(String(init.body)) as { summary: string };
      return Promise.resolve(
        event.summary === calendarFixture.oneOffEvents[0].title
          ? response(403, {
              error: {
                message: "Only the organizer can change this event",
                errors: [{ reason: "forbiddenForNonOrganizer" }],
              },
            })
          : response(201),
      );
    });

    mockExistingUmtasCalendar();
    await expect(
      syncToGoogleCalendar(calendarFixture, {
        accessToken: "token",
        timezone: "Africa/Johannesburg",
      }),
    ).resolves.toEqual({
      created: 2,
      updated: 0,
      deleted: 0,
      failed: [
        {
          key: "event-exam-1",
          status: 403,
          message: "Only the organizer can change this event",
        },
      ],
    });
  });

  it("retries a rate-limited event and then succeeds", async () => {
    let rateLimited = true;
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      if (init.method === "GET")
        return Promise.resolve(response(200, { items: [] }));
      const event = JSON.parse(String(init.body)) as { summary: string };
      if (
        event.summary === calendarFixture.recurringEvents[0].title &&
        rateLimited
      ) {
        rateLimited = false;
        return Promise.resolve(response(429));
      }
      return Promise.resolve(response(201));
    });

    mockExistingUmtasCalendar();
    await expect(
      syncToGoogleCalendar(calendarFixture, {
        accessToken: "token",
        timezone: "Africa/Johannesburg",
      }),
    ).resolves.toEqual({ created: 3, updated: 0, deleted: 0, failed: [] });
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("retries a failed event once more serially after the workers drain", async () => {
    let attempts = 0;
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      if (init.method === "GET")
        return Promise.resolve(response(200, { items: [] }));
      const event = JSON.parse(String(init.body)) as { summary: string };
      if (event.summary === calendarFixture.oneOffEvents[0].title) {
        attempts += 1;
        if (attempts === 1) {
          return Promise.resolve(
            response(403, {
              error: {
                message: "Temporarily forbidden",
                errors: [{ reason: "forbiddenForNonOrganizer" }],
              },
            }),
          );
        }
      }
      return Promise.resolve(response(201));
    });

    mockExistingUmtasCalendar();
    await expect(
      syncToGoogleCalendar(calendarFixture, {
        accessToken: "token",
        timezone: "Africa/Johannesburg",
      }),
    ).resolves.toEqual({ created: 3, updated: 0, deleted: 0, failed: [] });
    expect(attempts).toBe(2);
  });

  it("throws for a missing or rejected access token", async () => {
    await expect(
      syncToGoogleCalendar(calendarFixture, {
        accessToken: "",
      }),
    ).rejects.toMatchObject({ message: expect.stringContaining("required") });

    fetchMock.mockImplementation(() =>
      Promise.resolve(response(401, { error: { message: "expired" } })),
    );
    await expect(
      syncToGoogleCalendar(calendarFixture, {
        accessToken: "expired",
      }),
    ).rejects.toMatchObject({ message: expect.stringContaining("expired") });
  });

  it("skips an update when the stored content hash matches", async () => {
    const payload = {
      ...calendarFixture,
      oneOffEvents: [],
      allDayEvents: [],
    };
    const [mapped] = toGoogleCalendarEvents(payload, "Africa/Johannesburg");
    mockExistingUmtasCalendar();
    fetchMock.mockResolvedValueOnce(
      response(200, {
        items: [
          {
            id: mapped.id,
            extendedProperties: {
              private: {
                umtasHash: mapped.extendedProperties.private.umtasHash,
              },
            },
          },
        ],
      }),
    );

    await expect(
      syncToGoogleCalendar(payload, {
        accessToken: "token",
        timezone: "Africa/Johannesburg",
      }),
    ).resolves.toEqual({ created: 0, updated: 0, deleted: 0, failed: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.some(([, init]) => init.method === "PUT")).toBe(
      false,
    );
  });

  it("reconciles managed events by deleting only orphans", async () => {
    fetchMock.mockImplementation((url: string, init: RequestInit) => {
      if (init.method === "GET") {
        return Promise.resolve(
          response(200, { items: [{ id: "umtasorphan" }] }),
        );
      }
      if (init.method === "POST") return Promise.resolve(response(201));
      if (init.method === "DELETE") return Promise.resolve(response(204));
      return Promise.reject(
        new Error(`Unexpected request: ${init.method} ${url}`),
      );
    });

    mockExistingUmtasCalendar();
    await expect(
      syncToGoogleCalendar(calendarFixture, {
        accessToken: "token",
        timezone: "Africa/Johannesburg",
        reconcile: true,
      }),
    ).resolves.toEqual({ created: 3, updated: 0, deleted: 1, failed: [] });
    expect(
      fetchMock.mock.calls.filter(([, init]) => init.method === "DELETE"),
    ).toHaveLength(1);
    expect(fetchMock.mock.calls.at(-1)?.[0]).toMatch(/\/events\/umtasorphan$/);
    expect(
      fetchMock.mock.calls.find(
        ([url, init]) =>
          init.method === "GET" && String(url).includes("/events?"),
      )?.[0],
    ).toContain("privateExtendedProperty=umtas%3D1");
  });

  it("paginates reconciliation and records an orphan deletion failure", async () => {
    fetchMock.mockImplementation((url: string, init: RequestInit) => {
      if (init.method === "GET" && url.includes("pageToken=second")) {
        return Promise.resolve(
          response(200, { items: [{ id: "orphan-two" }] }),
        );
      }
      if (init.method === "POST") return Promise.resolve(response(201));
      if (init.method === "GET") {
        return Promise.resolve(
          response(200, {
            items: [{ id: "orphan-one" }],
            nextPageToken: "second",
          }),
        );
      }
      if (init.method === "DELETE" && url.endsWith("orphan-one")) {
        return Promise.resolve(
          response(403, {
            error: {
              message: "Not the organizer",
              errors: [{ reason: "forbiddenForNonOrganizer" }],
            },
          }),
        );
      }
      if (init.method === "DELETE") return Promise.resolve(response(204));
      return Promise.reject(
        new Error(`Unexpected request: ${init.method} ${url}`),
      );
    });

    mockExistingUmtasCalendar();
    await expect(
      syncToGoogleCalendar(calendarFixture, {
        accessToken: "token",
        timezone: "Africa/Johannesburg",
        reconcile: true,
      }),
    ).resolves.toEqual({
      created: 3,
      updated: 0,
      deleted: 1,
      failed: [
        { key: "orphan-orphan-one", status: 403, message: "Not the organizer" },
      ],
    });
    expect(
      fetchMock.mock.calls.filter(
        ([url, init]) =>
          init.method === "GET" && String(url).includes("/events?"),
      ),
    ).toHaveLength(2);
    expect(
      fetchMock.mock.calls.filter(([, init]) => init.method === "DELETE"),
    ).toHaveLength(2);
  });
});
