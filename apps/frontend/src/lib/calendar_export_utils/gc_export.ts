import { addDays, buildWeeklyRrule, toBasicDateTime } from "./calendar_time";
import type { GeneratedCalendarPayloadDto } from "./types";
import { ensureUmtasCalendar } from "./gc_calendars";
import { GoogleApiError, GoogleAuthError, requestGoogle } from "./google_http";
import { assertCalendarPayload } from "./validation";

const BASE32_HEX = "0123456789abcdefghijklmnopqrstuv";
const CONCURRENCY = 5;
const MAX_EVENT_LIST_PAGES = 20;
const TEXT_ENCODER = new TextEncoder();

interface GoogleTimedDate {
  dateTime: string;
  timeZone: string;
}

interface GoogleAllDayDate {
  date: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: GoogleTimedDate | GoogleAllDayDate;
  end: GoogleTimedDate | GoogleAllDayDate;
  recurrence?: string[];
  extendedProperties: {
    private: {
      umtas: "1";
      umtasHash: string;
    };
  };
}

export interface GoogleCalendarSyncResult {
  created: number;
  updated: number;
  deleted: number;
  failed: { key: string; status: number; message: string }[];
}

interface ManagedGoogleEvent {
  id?: string;
  extendedProperties?: {
    private?: Record<string, string>;
  };
}

type ManagedEventState = Map<string, string | undefined>;

function googleEventId(key: string): string {
  const bytes = TEXT_ENCODER.encode(key);
  let bits = 0;
  let bitCount = 0;
  let encoded = "";

  for (const byte of bytes) {
    bits = (bits << 8) | byte;
    bitCount += 8;
    while (bitCount >= 5) {
      encoded += BASE32_HEX[(bits >>> (bitCount - 5)) & 31];
      bitCount -= 5;
      bits &= (1 << bitCount) - 1;
    }
  }
  if (bitCount > 0) encoded += BASE32_HEX[(bits << (5 - bitCount)) & 31];
  if (encoded.length <= 1019) return `umtas${encoded}`;
  return `umtas${encoded.slice(0, 1003)}${contentHash(key)}`;
}

function localDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

function contentHash(value: unknown): string {
  const text = JSON.stringify(value);
  let first = 0x811c9dc5;
  let second = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    first = Math.imul(first ^ text.charCodeAt(index), 0x01000193);
    second = Math.imul(
      second ^ text.charCodeAt(text.length - index - 1),
      0x01000193,
    );
  }
  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

function managedEvent(
  event: Omit<GoogleCalendarEvent, "extendedProperties">,
): GoogleCalendarEvent {
  return {
    ...event,
    extendedProperties: {
      private: {
        umtas: "1",
        umtasHash: contentHash(event),
      },
    },
  };
}

export function toGoogleCalendarEvents(
  payload: GeneratedCalendarPayloadDto,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
): GoogleCalendarEvent[] {
  assertCalendarPayload(payload, timezone);
  const events: GoogleCalendarEvent[] = [];

  for (const event of payload.recurringEvents) {
    const recurrence = [
      `RRULE:${buildWeeklyRrule({ ...event, tzid: timezone })}`,
      ...(event.excludedDates.length
        ? [
            `EXDATE;TZID=${timezone}:${event.excludedDates
              .map((date) => toBasicDateTime(date, event.startTime))
              .join(",")}`,
          ]
        : []),
      ...(event.additionalDates.length
        ? [
            `RDATE;TZID=${timezone}:${event.additionalDates
              .map((date) => toBasicDateTime(date, event.startTime))
              .join(",")}`,
          ]
        : []),
    ];
    events.push(
      managedEvent({
        id: googleEventId(event.key),
        summary: event.title,
        ...(event.description === undefined
          ? {}
          : { description: event.description }),
        ...(event.location === undefined ? {} : { location: event.location }),
        start: {
          dateTime: localDateTime(event.startsOn, event.startTime),
          timeZone: timezone,
        },
        end: {
          dateTime: localDateTime(event.startsOn, event.endTime),
          timeZone: timezone,
        },
        recurrence,
      }),
    );
  }

  for (const event of payload.oneOffEvents) {
    events.push(
      managedEvent({
        id: googleEventId(event.key),
        summary: event.title,
        ...(event.description === undefined
          ? {}
          : { description: event.description }),
        ...(event.location === undefined ? {} : { location: event.location }),
        start: {
          dateTime: localDateTime(event.date, event.startTime),
          timeZone: timezone,
        },
        end: {
          dateTime: localDateTime(event.date, event.endTime),
          timeZone: timezone,
        },
      }),
    );
  }

  for (const event of payload.allDayEvents) {
    events.push(
      managedEvent({
        id: googleEventId(event.key),
        summary: event.title,
        ...(event.description === undefined
          ? {}
          : { description: event.description }),
        start: { date: event.startDate },
        end: { date: addDays(event.endDate, 1) },
      }),
    );
  }

  return events;
}

function abortError(): Error {
  return new DOMException("The operation was aborted", "AbortError");
}

async function listManagedEvents(
  calendarId: string,
  opts: { accessToken: string; signal?: AbortSignal },
): Promise<ManagedEventState> {
  const managedEvents: ManagedEventState = new Map();
  let pageToken: string | undefined;
  let pageCount = 0;

  do {
    pageCount += 1;
    const query = new URLSearchParams({
      maxResults: "2500",
      privateExtendedProperty: "umtas=1",
      showDeleted: "false",
      fields: "items(id,extendedProperties),nextPageToken",
    });
    if (pageToken) query.set("pageToken", pageToken);

    const response = await requestGoogle(
      `calendars/${encodeURIComponent(calendarId)}/events?${query}`,
      { method: "GET" },
      opts.accessToken,
      { signal: opts.signal },
    );
    const body = (await response.json()) as {
      items?: ManagedGoogleEvent[];
      nextPageToken?: string;
    };

    for (const event of body.items ?? []) {
      if (event.id) {
        managedEvents.set(
          event.id,
          event.extendedProperties?.private?.umtasHash,
        );
      }
    }
    pageToken = body.nextPageToken;
  } while (pageToken && pageCount < MAX_EVENT_LIST_PAGES);

  return managedEvents;
}

export async function syncToGoogleCalendar(
  payload: GeneratedCalendarPayloadDto,
  opts: {
    accessToken: string;
    timezone?: string;
    signal?: AbortSignal;
    reconcile?: boolean;
  },
): Promise<GoogleCalendarSyncResult> {
  if (!opts.accessToken.trim())
    throw new Error("A Google access token is required");
  if (opts.signal?.aborted) throw abortError();

  const calendarId = await ensureUmtasCalendar(opts.accessToken, {
    signal: opts.signal,
  });
  const existingEvents = await listManagedEvents(calendarId, {
    accessToken: opts.accessToken,
    signal: opts.signal,
  });
  const collectionUrl = `calendars/${encodeURIComponent(calendarId)}/events`;
  const mappedEvents = toGoogleCalendarEvents(payload, opts.timezone);
  const result: GoogleCalendarSyncResult = {
    created: 0,
    updated: 0,
    deleted: 0,
    failed: [],
  };
  const sourceKeys = [
    ...payload.recurringEvents,
    ...payload.oneOffEvents,
    ...payload.allDayEvents,
  ].map((event) => event.key);
  let nextIndex = 0;

  async function syncOne(event: GoogleCalendarEvent): Promise<void> {
    const existingHash = existingEvents.get(event.id);
    if (existingHash === event.extendedProperties.private.umtasHash) return;

    const isUpdate = existingEvents.has(event.id);
    try {
      await requestGoogle(
        isUpdate
          ? `${collectionUrl}/${encodeURIComponent(event.id)}`
          : collectionUrl,
        {
          method: isUpdate ? "PUT" : "POST",
          body: JSON.stringify(event),
        },
        opts.accessToken,
        { signal: opts.signal },
      );
    } catch (error) {
      if (
        !(error instanceof GoogleApiError) ||
        error.status !== 409 ||
        isUpdate
      ) {
        throw error;
      }

      await requestGoogle(
        `${collectionUrl}/${encodeURIComponent(event.id)}`,
        { method: "PUT", body: JSON.stringify(event) },
        opts.accessToken,
        { signal: opts.signal },
      );
      result.updated += 1;
      return;
    }
    if (isUpdate) result.updated += 1;
    else result.created += 1;
  }

  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= mappedEvents.length) return;
      try {
        await syncOne(mappedEvents[index]);
      } catch (error) {
        if (
          opts.signal?.aborted ||
          (error instanceof DOMException && error.name === "AbortError") ||
          error instanceof GoogleAuthError
        ) {
          throw error;
        }
        result.failed.push({
          key: sourceKeys[index],
          status: error instanceof GoogleApiError ? error.status : 0,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, mappedEvents.length) }, worker),
  );

  if (opts.reconcile) {
    const desiredIds = new Set(mappedEvents.map((event) => event.id));
    for (const existingId of existingEvents.keys()) {
      if (desiredIds.has(existingId)) continue;
      try {
        await requestGoogle(
          `${collectionUrl}/${encodeURIComponent(existingId)}`,
          { method: "DELETE" },
          opts.accessToken,
          { signal: opts.signal },
        );
        result.deleted += 1;
      } catch (error) {
        if (
          opts.signal?.aborted ||
          (error instanceof DOMException && error.name === "AbortError") ||
          error instanceof GoogleAuthError
        ) {
          throw error;
        }
        result.failed.push({
          key: `orphan-${existingId}`,
          status: error instanceof GoogleApiError ? error.status : 0,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return result;
}
