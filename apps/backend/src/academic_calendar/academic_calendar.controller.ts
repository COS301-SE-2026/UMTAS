//The academic calendar module is responsible for CRUD on academic calendars, and CRUD on calendar restrictions.
//It also is responsible for returning a generated calender, meaning it takes in a timetable for a given university,
//and returns a calendar with all the events and restrictions applied to it.
//Restrictions include things like holidays, exam periods, test weeks, day swaps, public holidays, etc.
//We want to use recurring to generate the events for the calendar. Exporting to Google Calendar and ICS.
// NOTE to avoid ratelimiting, etc. we are doing the actual GC and ics export in the frontend, and not the backend.
// The backend will just generate the calendar object with the events and return them to the frontend.

//All Endpoints are fully defined in swagger, with detailed input defaults, expected errors, etc.

//Endpoints:
//CRUD on Academic Calendar these are by university, uni admin only, and only one calendar per university, per year.
// GET /academic-calendar/:id
// POST /academic-calendar
// PUT /academic-calendar/:id
// DELETE /academic-calendar/:id

//CRUD on Calendar Restrictions these are by university, uni admin only, and only one calendar per university, per year.
// GET /academic-calendar/:id/restrictions
// POST /academic-calendar/:id/restrictions
// PUT /academic-calendar/:id/restrictions/:restrictionId
// DELETE /academic-calendar/:id/restrictions/:restrictionId

//Generate Calendar for a given timetable and university, with all restrictions applied. This is a public endpoint, and can be used by anyone.
// POST /academic-calendar/generate
// GET /academic-calendar/generate/:id

//The frontend then implements:
// Academic Calendar Management
// Calendar Restrictions Management
// Calendar Generation and Export to Google Calendar and ICS

//The DB will need to store:
// Academic Calendar: id, universityId, year, createdAt, updatedAt
// Calendar Restrictions: id, academicCalendarId, type, startDate, endDate, description, createdAt, updatedAt
//  NOTE: Restrictions can also be like a semester start and end date, or a holiday period, or a day swap, etc. So the type field will be an enum of the different types of restrictions we support. The description field will be a string that describes the restriction in more detail. The startDate and endDate fields will be used to determine when the restriction applies.
// Generated Calendar: id, academicCalendarId, generatedAt, JSON Blob sent to frontend, timetableId, universityId, createdAt, updatedAt
