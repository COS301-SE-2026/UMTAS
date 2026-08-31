/** @jest-environment node */

import {
  createCalendar,
  ensureUmtasCalendar,
  getCalendar,
  listWritableCalendars,
} from "./gc_calendars";

function response(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Google calendars", () => {
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
  });

  it("paginates writable calendars, drops deleted entries, and sorts primary first", async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(200, {
          items: [
            { id: "z", summary: "Zulu", accessRole: "writer" },
            {
              id: "gone",
              summary: "Deleted",
              accessRole: "owner",
              deleted: true,
            },
          ],
          nextPageToken: "next",
        }),
      )
      .mockResolvedValueOnce(
        response(200, {
          items: [
            { id: "p", summary: "Primary", accessRole: "owner", primary: true },
          ],
        }),
      );
    await expect(listWritableCalendars("token")).resolves.toEqual([
      { id: "p", summary: "Primary", accessRole: "owner", primary: true },
      { id: "z", summary: "Zulu", accessRole: "writer", primary: false },
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain("minAccessRole=writer");
    expect(fetchMock.mock.calls[0][0]).toContain("showHidden=false");
    expect(fetchMock.mock.calls[1][0]).toContain("pageToken=next");
  });

  it("creates and gets normalized calendars", async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(200, { id: "new", summary: "My timetable", timeZone: "UTC" }),
      )
      .mockResolvedValueOnce(
        response(200, { id: "new", summary: "My timetable" }),
      );
    await expect(
      createCalendar("token", { summary: "My timetable", timeZone: "UTC" }),
    ).resolves.toMatchObject({
      id: "new",
      accessRole: "owner",
      primary: false,
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      summary: "My timetable",
      timeZone: "UTC",
    });
    await expect(getCalendar("token", "new")).resolves.toMatchObject({
      id: "new",
      accessRole: "writer",
    });
  });

  it("ensures a named calendar through the shared retrying operations", async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, { items: [] }))
      .mockResolvedValueOnce(
        response(200, { id: "created", summary: "Course calendar" }),
      );
    await expect(ensureUmtasCalendar("token", "Course calendar")).resolves.toBe(
      "created",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("threads cancellation through calendar discovery", async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          if (init.signal?.aborted) {
            reject(new DOMException("aborted", "AbortError"));
            return;
          }
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );

    const discovery = ensureUmtasCalendar("token", "UMTAS", {
      signal: controller.signal,
    });
    controller.abort();

    await expect(discovery).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("caps calendar-list pagination", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(response(200, { items: [], nextPageToken: "stuck" })),
    );

    await expect(listWritableCalendars("token")).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(20);
  });
});
