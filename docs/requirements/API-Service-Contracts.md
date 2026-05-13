# API Service Contracts

The UMTAS REST API provides a contract between the frontend clients and the Core API backend. All endpoints are protected by authentication (JWT-based session tokens) and role-based access control (RBAC). Communication uses JSON over HTTPS.

**Base URL:** `https://{domain}/api`  
**Authentication:** Bearer token (JWT) in Authorization header  
**Content-Type:** `application/json`  
**Versioning:** URIs include `/api/v1/` for future API evolution

---

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "SecurePassword123!",
  "displayName": "John Doe",
  "role": "student"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-user-id",
  "email": "student@university.edu",
  "displayName": "John Doe",
  "role": "student",
  "createdAt": "2024-05-13T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` — Email already registered
- `422 Unprocessable Entity` — Validation failure (weak password, invalid email)

---

### POST /auth/login

Authenticate with email and password; return access and refresh tokens.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "uuid-refresh-token",
  "expiresIn": 3600
}
```

**Error Responses:**
- `401 Unauthorized` — Invalid credentials
- `423 Locked` — Account locked after failed attempts

---

### POST /auth/logout

Invalidate the current session.

**Request Body:** (empty)

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**
- `401 Unauthorized` — No valid session token

---

### POST /auth/refresh

Refresh an expired access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "uuid-refresh-token"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

---

### POST /auth/request-password-reset

Initiate a password reset flow; send email with reset link.

**Request Body:**
```json
{
  "email": "student@university.edu"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset email sent"
}
```

---

### POST /auth/reset-password

Reset password using a reset token.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

---

## Timetable Endpoints

### POST /timetables/generate

Request timetable generation from selected modules and preferences.

**Request Body:**
```json
{
  "modules": [
    { "id": "uuid-module-id", "name": "COS301" }
  ],
  "preferences": {
    "preferMornings": true,
    "minimiseGaps": true
  }
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "uuid-job-id",
  "status": "queued",
  "message": "Timetable generation job submitted"
}
```

---

### GET /timetables/{timetableId}

Retrieve a generated or manually created timetable.

**Response (200 OK):**
```json
{
  "id": "uuid-timetable-id",
  "title": "My Spring Semester",
  "status": "generated",
  "source": "solver",
  "entries": [
    {
      "id": "uuid-entry-id",
      "eventId": "uuid-event-id",
      "resolvedDate": "2024-05-20",
      "resolvedStartTime": "09:00",
      "resolvedDurationMins": 50,
      "resolvedVenue": "Engineering Building, Room 301"
    }
  ],
  "createdAt": "2024-05-13T10:30:00Z"
}
```

---

### POST /timetables

Create a new timetable (manual).

**Request Body:**
```json
{
  "title": "My Custom Timetable",
  "modules": [
    { "id": "uuid-module-id", "name": "COS301" }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-timetable-id",
  "title": "My Custom Timetable",
  "status": "draft",
  "source": "manual"
}
```

---

### PUT /timetables/{timetableId}

Update an existing timetable.

**Request Body:**
```json
{
  "title": "Updated Title",
  "entries": [...]
}
```

**Response (200 OK):** Updated timetable object

---

### DELETE /timetables/{timetableId}

Delete a timetable.

**Response (204 No Content):**

---

### GET /timetables

List all timetables for the authenticated user.

**Query Parameters:**
- `status` — Filter by status (draft, generated, manual, exported)
- `skip` — Pagination offset (default: 0)
- `take` — Pagination limit (default: 20)

**Response (200 OK):**
```json
{
  "total": 5,
  "timetables": [
    { "id": "...", "title": "...", "status": "..." }
  ]
}
```

---

## PDF Upload and Processing

### POST /adapters/pdf/upload

Upload a PDF for parsing.

**Request:** `multipart/form-data`
- `file` — PDF document (required, max 50 MB)
- `university` — University identifier (optional, defaults to auto-detect)

**Response (202 Accepted):**
```json
{
  "jobId": "uuid-job-id",
  "status": "pending",
  "message": "PDF parsing job queued"
}
```

**Error Responses:**
- `400 Bad Request` — No file provided
- `415 Unsupported Media Type` — Not a PDF

---

### GET /adapters/pdf/status/{jobId}

Poll the status of a PDF parsing job.

**Response (200 OK):**
```json
{
  "jobId": "uuid-job-id",
  "status": "processing",
  "progress": 45,
  "result": null
}
```

**Possible Status Values:** `pending`, `processing`, `completed`, `failed`

**Response on Completion (200 OK):**
```json
{
  "jobId": "uuid-job-id",
  "status": "completed",
  "result": {
    "modules": [
      {
        "id": "uuid-module-id",
        "code": "COS301",
        "name": "Software Engineering",
        "events": [...]
      }
    ]
  }
}
```

---

## User Management

### GET /users/me

Retrieve the authenticated user's profile.

**Response (200 OK):**
```json
{
  "id": "uuid-user-id",
  "email": "student@university.edu",
  "displayName": "John Doe",
  "role": "student",
  "timezone": "Africa/Johannesburg",
  "createdAt": "2024-05-13T10:30:00Z"
}
```

---

### PUT /users/me

Update the authenticated user's profile.

**Request Body:**
```json
{
  "displayName": "John Smith",
  "timezone": "Africa/Johannesburg"
}
```

**Response (200 OK):** Updated user object

---

### PUT /users/me/password

Change password.

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

---

## Admin Dashboard

### GET /admin/analytics/venue

Retrieve venue utilisation analytics.

**Query Parameters:**
- `from` — Start date (ISO 8601)
- `to` — End date (ISO 8601)

**Response (200 OK):**
```json
{
  "venues": [
    {
      "id": "uuid-venue-id",
      "name": "Engineering Building, Room 301",
      "capacity": 60,
      "utilisationRate": 0.85,
      "bookings": 17,
      "peakHours": ["09:00-10:00", "14:00-15:00"]
    }
  ]
}
```

---

### GET /admin/analytics/lecturer-workload

Retrieve lecturer workload analytics.

**Response (200 OK):**
```json
{
  "lecturers": [
    {
      "id": "uuid-lecturer-id",
      "name": "Prof. Jane Smith",
      "totalContactHours": 12,
      "totalModules": 3,
      "averageLecturesPerWeek": 4
    }
  ]
}
```

---

### GET /admin/analytics/attendance

Retrieve attendance analytics for a specific module time slot.

**Query Parameters:**
- `moduleId` — Module identifier
- `eventDate` — Event date (ISO 8601)
- `eventTime` — Event time (HH:MM)

**Response (200 OK):**
```json
{
  "registered": 120,
  "actual": 98,
  "projected": 105,
  "attendanceRate": 0.817
}
```

---

## Calendar Export

### POST /exports/google-calendar

Export a timetable to authenticated user's Google Calendar.

**Request Body:**
```json
{
  "timetableId": "uuid-timetable-id",
  "calendarName": "My Classes"
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "uuid-job-id",
  "status": "pending",
  "message": "Calendar export job submitted"
}
```

---

### GET /exports/ics/{timetableId}

Download a timetable as an ICS file.

**Response (200 OK):**
```
Content-Type: text/calendar
Content-Disposition: attachment; filename="timetable.ics"

BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UMTAS//University Modular Timetable Analytics System//EN
...
END:VCALENDAR
```

---

## Error Response Schema

All errors follow a consistent JSON schema:

```json
{
  "error": "BadRequestException | UnauthorizedException | ForbiddenException | NotFoundException | ...",
  "message": "Human-readable error description",
  "statusCode": 400,
  "timestamp": "2024-05-13T10:30:00Z",
  "path": "/api/v1/timetables/invalid-id"
}
```

**Standard HTTP Status Codes:**

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful read or update |
| 201 | Created | Resource created (POST) |
| 202 | Accepted | Async job submitted |
| 204 | No Content | Successful deletion |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Token valid but insufficient role |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation failure |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected exception |
| 503 | Service Unavailable | Temporary service issue |

---

## Rate Limiting

All endpoints are rate-limited per authenticated user:

- **Default:** 100 requests per minute
- **Auth Endpoints:** 5 login attempts per 15 minutes per IP (brute-force protection)
- **PDF Upload:** 10 files per hour per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1715592000
```

---

## Pagination

List endpoints support cursor-based pagination:

**Query Parameters:**
- `skip` — Number of items to skip (default: 0)
- `take` — Number of items to return (default: 20, max: 100)

**Response:**
```json
{
  "total": 150,
  "skip": 0,
  "take": 20,
  "items": [...]
}
```

---

## API Documentation

Full OpenAPI/Swagger documentation is automatically generated and available at:

- **Swagger UI:** `https://{domain}/api/docs`
- **OpenAPI JSON:** `https://{domain}/api/docs-json`

These endpoints require authentication (same JWT token) and are read-only.
