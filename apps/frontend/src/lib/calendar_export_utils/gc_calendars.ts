import { requestGoogle, type GoogleRequestOptions } from "./google_http";

const MAX_CALENDAR_LIST_PAGES = 20;
const UMTAS_CALENDAR_NAME = "UMTAS";

interface GoogleCalendar {
  id: string;
  summary: string;
}

interface CalendarListEntry {
  id?: string;
  summary?: string;
  deleted?: boolean;
}

function normalize(calendar: CalendarListEntry): GoogleCalendar {
  if (!calendar.id)
    throw new Error("Google Calendar API returned no calendar id");
  return {
    id: calendar.id,
    summary: calendar.summary ?? calendar.id,
  };
}

async function listWritableCalendars(
  accessToken: string,
  opts: GoogleRequestOptions = {},
): Promise<GoogleCalendar[]> {
  if (!accessToken.trim()) throw new Error("A Google access token is required");
  const calendars: GoogleCalendar[] = [];
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
  return calendars;
}

async function createCalendar(
  accessToken: string,
  input: { summary: string; description?: string; timeZone?: string },
  opts: GoogleRequestOptions = {},
): Promise<GoogleCalendar> {
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
  return normalize((await response.json()) as CalendarListEntry);
}

export async function ensureUmtasCalendar(
  accessToken: string,
  opts: GoogleRequestOptions = {},
): Promise<string> {
  const existing = (await listWritableCalendars(accessToken, opts)).find(
    (calendar) => calendar.summary === UMTAS_CALENDAR_NAME,
  );
  return (
    existing?.id ??
    (await createCalendar(accessToken, { summary: UMTAS_CALENDAR_NAME }, opts))
      .id
  );
}
