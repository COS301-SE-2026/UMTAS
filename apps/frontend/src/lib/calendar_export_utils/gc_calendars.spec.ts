/** @jest-environment node */

import { ensureUmtasCalendar } from "./gc_calendars";

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

  it("paginates calendar discovery and reuses an existing UMTAS calendar", async () => {
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
          items: [{ id: "p", summary: "UMTAS" }],
        }),
      );
    await expect(ensureUmtasCalendar("token")).resolves.toBe("p");
    expect(fetchMock.mock.calls[0][0]).toContain("minAccessRole=writer");
    expect(fetchMock.mock.calls[0][0]).toContain("showHidden=false");
    expect(fetchMock.mock.calls[1][0]).toContain("pageToken=next");
  });

  it("creates the UMTAS calendar when discovery finds none", async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, { items: [] }))
      .mockResolvedValueOnce(
        response(200, { id: "created", summary: "UMTAS" }),
      );
    await expect(ensureUmtasCalendar("token")).resolves.toBe("created");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      summary: "UMTAS",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
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

    const discovery = ensureUmtasCalendar("token", {
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

    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.endsWith("/calendars")
          ? response(200, { id: "created" })
          : response(200, { items: [], nextPageToken: "stuck" }),
      ),
    );

    await expect(ensureUmtasCalendar("token")).resolves.toBe("created");
    expect(fetchMock).toHaveBeenCalledTimes(21);
  });
});
