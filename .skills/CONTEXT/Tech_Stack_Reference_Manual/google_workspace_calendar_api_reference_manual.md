# Google Workspace Calendar API Reference Manual (v3)

## Section 0: Quick Start

Add an event to a user's primary calendar using the Node.js Client Library:

```bash
npm install googleapis @google-cloud/local-auth
```

```javascript
const calendar = google.calendar({ version: "v3", auth });
const event = {
  summary: "Quick Start Event",
  start: { dateTime: "2026-05-01T09:00:00Z" },
  end: { dateTime: "2026-05-01T10:00:00Z" },
};
const res = await calendar.events.insert({
  calendarId: "primary",
  requestBody: event,
});
console.log("Event created:", res.data.htmlLink);
```

Visit `calendar.google.com` → See "Quick Start Event" on May 1st, 2026.

## Section 1: Key Language Terms/Features

- **Events** — Single or recurring calendar entries | `resource: { summary, start, end }` | ⚠️ Always provide a `timeZone` to avoid UTC-offset bugs.
- **Primary Calendar** — The user's main calendar (ID is usually 'primary') | `calendarId: 'primary'` | ⚠️ Deleting this is impossible; use `clear` to empty it.
- **Secondary Calendar** — User-created calendars | `calendarId: 'ID_STRING'` | ⚠️ Starting 2026, every secondary calendar has exactly one `dataOwner`.
- **ACL (Access Control List)** — Permission rules for a calendar | `calendar.acl.insert({ ... })` | ⚠️ Essential for sharing calendars across a workspace.
- **Sync Tokens** — Strings used to fetch only changed data | `nextSyncToken: '...'` | ⚠️ Don't store full lists; use tokens for efficient syncing.
- **Incremental Sync** — Process of updating local data using sync tokens | (Workflow) | ⚠️ If a token expires (410 GONE), you must perform a full re-sync.
- **Conference Data** — Metadata for virtual meetings (Google Meet) | `conferenceData: { createRequest: { ... } }` | ⚠️ Generate unique codes for every event to maintain security.
- **Transparency** — Defines if an event blocks time | `transparency: 'opaque'` (Busy) | ⚠️ Set to `transparent` for "Free" events like reminders.
- **Event Types** — Specialized classifications | `eventType: 'focusTime' | 'outOfOffice'` | ⚠️ Use these to trigger specific UI behaviors in Workspace.
- **MCP Server** — (2026) AI Agent interface for Calendar data | (Standard Protocol) | ⚠️ Allows AI agents to read/write schedules without custom logic.

## Section 2: Key Commands & Workflows

- `calendar.events.insert` — Creates a new event | _Adding appointments or meetings_
- `calendar.events.list` — Retrieves events | _Viewing schedules or finding free slots_
- `calendar.events.watch` — Sets up a webhook notification | _Reacting to user changes in real-time_
- `calendar.freebusy.query` — Checks availability for multiple users | _Scheduling group meetings_
- `calendar.calendars.insert` — Creates a new secondary calendar | _Organizing team or project schedules_
- `calendar.acl.list` — Views permissions | _Auditing who has access to a calendar_
- `calendar.settings.get` — Retrieves user preferences | _Checking default time zones or languages_
- `calendar.events.patch` — Updates specific fields of an event | _Changing an event title without resending full data_

## Section 3: Architecture & Component Relationships

```
[Application] → [OAuth 2.0 Credentials] → [Google API Client]
                                             ↓
[Calendar List] ← [ACL Rules] ← [Calendar API (v3)] → [Sync Tokens]
                                             ↓
    [Primary Calendar] / [Secondary Calendars] → [Events] → [Conference Data]
```

The API centers on **Events** within **Calendars**. Access is governed by **ACLs**, and performance is optimized through **Sync Tokens**. Integration with **Google Meet** occurs via the Conference Data object.

## Section 4: Documentation Links

- [Official API Reference](https://developers.google.com/calendar/api/v3/reference) — _Detailed endpoint specifications_
- [Node.js Quickstart](https://developers.google.com/calendar/api/quickstart/nodejs) — _Step-by-step setup guide_
- [Ownership Model Updates (2026)](https://workspaceupdates.googleblog.com/) — _Critical info on secondary calendar deletion_
- [Google API Explorer](https://developers.google.com/calendar/api/v3/reference/events/list?apix=true) — _Test API calls in the browser_
