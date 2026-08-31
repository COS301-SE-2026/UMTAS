import { requestGoogle, type GoogleRequestOptions } from "./google_http";

const MAX_CALENDAR_LIST_PAGES = 20;

export interface GoogleCalendarSummary {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
  backgroundColor?: string;
  accessRole: "owner" | "writer";
  primary: boolean;
}

interface CalendarListEntry extends Partial<GoogleCalendarSummary> {
  deleted?: boolean;
}

function normalize(
  calendar: CalendarListEntry,
  defaults?: Pick<GoogleCalendarSummary, "accessRole" | "primary">,
): GoogleCalendarSummary {
  if (!calendar.id)
    throw new Error("Google Calendar API returned no calendar id");
  return {
    id: calendar.id,
    summary: calendar.summary ?? calendar.id,
    ...(calendar.description === undefined
      ? {}
      : { description: calendar.description }),
    ...(calendar.timeZone === undefined ? {} : { timeZone: calendar.timeZone }),
    ...(calendar.backgroundColor === undefined
      ? {}
      : { backgroundColor: calendar.backgroundColor }),
    accessRole: calendar.accessRole ?? defaults?.accessRole ?? "writer",
    primary: calendar.primary ?? defaults?.primary ?? false,
  };
}

export async function listWritableCalendars(
  accessToken: string,
  opts: GoogleRequestOptions = {},
): Promise<GoogleCalendarSummary[]> {
  if (!accessToken.trim()) throw new Error("A Google access token is required");
  const calendars: GoogleCalendarSummary[] = [];
  let pageToken: string | undefined;
  let pageCount = 0;
  do {
    pageCount += 1;
    const query = new URLSearchParams({
      maxResults: "250",
      minAccessRole: "writer",
      showHidden: "false",
    });
    if (pageToken) query.set("pageToken", pageToken);
    const response = await requestGoogle(
      `users/me/calendarList?${query}`,
      { method: "GET" },
      accessToken,
      opts,
    );
    const body = (await response.json()) as {
      items?: CalendarListEntry[];
      nextPageToken?: string;
    };
    for (const calendar of body.items ?? []) {
      if (!calendar.deleted && calendar.id) calendars.push(normalize(calendar));
    }
    pageToken = body.nextPageToken;
  } while (pageToken && pageCount < MAX_CALENDAR_LIST_PAGES);
  return calendars.sort(
    (left, right) =>
      Number(right.primary) - Number(left.primary) ||
      left.summary.localeCompare(right.summary),
  );
}

export async function createCalendar(
  accessToken: string,
  input: { summary: string; description?: string; timeZone?: string },
  opts: GoogleRequestOptions = {},
): Promise<GoogleCalendarSummary> {
  if (!accessToken.trim()) throw new Error("A Google access token is required");
  const payload = {
    ...input,
    timeZone:
      input.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  const response = await requestGoogle(
    "calendars",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
    opts,
  );
  return normalize((await response.json()) as CalendarListEntry, {
    accessRole: "owner",
    primary: false,
  });
}

export async function getCalendar(
  accessToken: string,
  calendarId: string,
  opts: GoogleRequestOptions = {},
): Promise<GoogleCalendarSummary> {
  const response = await requestGoogle(
    `calendars/${encodeURIComponent(calendarId)}`,
    { method: "GET" },
    accessToken,
    opts,
  );
  return normalize((await response.json()) as CalendarListEntry, {
    accessRole: "writer",
    primary: calendarId === "primary",
  });
}

export async function ensureUmtasCalendar(
  accessToken: string,
  summary = "UMTAS",
  opts: GoogleRequestOptions = {},
): Promise<string> {
  const existing = (await listWritableCalendars(accessToken, opts)).find(
    (calendar) => calendar.summary === summary,
  );
  return (
    existing?.id ?? (await createCalendar(accessToken, { summary }, opts)).id
  );
}
