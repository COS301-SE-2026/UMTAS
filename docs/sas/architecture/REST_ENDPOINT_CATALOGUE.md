# REST Endpoint Catalogue

This catalogue is generated from `apps/backend/docs/openapi.json`. That document defines the committed request and response contracts.

**Source:** The committed OpenAPI document.

**Operations:** 162

The controllers also expose `GET /api/version`, `GET /api/health/live` and `GET /api/health/ready`. These operational routes are not yet included in the committed OpenAPI export. Readiness returns HTTP 503 when the database or Redis is not ready.

## Academic Calendar

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/academic-calendar` | `200, 400, 401, 403, 500` |
| `POST` | `/api/academic-calendar` | `201, 400, 401, 403, 409, 500` |
| `POST` | `/api/academic-calendar/generate` | `201, 400, 401, 403, 404, 409, 422, 500` |
| `GET` | `/api/academic-calendar/generated/{id}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/academic-calendar/public` | `200, 400, 401, 403, 500` |
| `DELETE` | `/api/academic-calendar/{id}` | `200, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/academic-calendar/{id}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/academic-calendar/{id}/restrictions` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/academic-calendar/{id}/restrictions` | `201, 400, 401, 403, 404, 409, 422, 500` |
| `DELETE` | `/api/academic-calendar/{id}/restrictions/{restrictionId}` | `200, 400, 401, 403, 404, 500` |
| `PUT` | `/api/academic-calendar/{id}/restrictions/{restrictionId}` | `200, 400, 401, 403, 404, 409, 422, 500` |
| `PUT` | `/api/academic-calendar/{id}/subscriptions` | `200, 400, 401, 403, 404, 409, 422, 500` |

## ApiService

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/api-service/course` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/api-service/courses` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/api-service/events` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/api-service/modules` | `200, 400, 401, 403, 404, 500` |

## App

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api` | `200, 400, 500` |

## Attendance

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/attendance` | `200, 400, 401, 403, 500` |
| `POST` | `/api/attendance` | `201, 400, 401, 403, 409, 500` |
| `GET` | `/api/attendance/me/verified-history` | `200, 400, 401, 403, 500` |
| `GET` | `/api/attendance/nfc-tags/me` | `200, 400, 401, 403, 500` |
| `POST` | `/api/attendance/nfc-tags/registration` | `201, 400, 401, 403, 409, 500` |
| `POST` | `/api/attendance/nfc-tags/registration/confirm` | `201, 400, 401, 403, 409, 500` |
| `POST` | `/api/attendance/nfc-tags/test` | `201, 400, 401, 403, 409, 500` |
| `DELETE` | `/api/attendance/operator/preferred-event` | `200, 400, 401, 403, 500` |
| `PUT` | `/api/attendance/operator/preferred-event` | `200, 400, 401, 403, 409, 500` |
| `GET` | `/api/attendance/operator/slots` | `200, 400, 401, 403, 500` |
| `POST` | `/api/attendance/records` | `201, 400, 401, 403, 409, 500` |
| `PUT` | `/api/attendance/records/barcode` | `200, 400, 401, 403, 409, 500` |
| `GET` | `/api/attendance/sessions` | `200, 400, 401, 403, 500` |
| `POST` | `/api/attendance/sessions` | `201, 400, 401, 403, 409, 500` |
| `DELETE` | `/api/attendance/sessions/{sessionId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/attendance/sessions/{sessionId}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/attendance/sessions/{sessionId}` | `200, 400, 401, 403, 404, 409, 500` |
| `PUT` | `/api/attendance/sessions/{sessionId}/attendance/count` | `200, 400, 401, 403, 404, 409, 500` |
| `DELETE` | `/api/attendance/{attendanceId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/attendance/{attendanceId}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/attendance/{attendanceId}` | `200, 400, 401, 403, 404, 409, 500` |

## Auth

| Method | Route | Documented response statuses |
|---|---|---|
| `POST` | `/api/auth/admin/ban-user` | `200, 400, 401, 403, 404, 409, 500` |
| `POST` | `/api/auth/admin/create-mock-user` | `200, 400, 401, 403, 409, 500` |
| `POST` | `/api/auth/admin/create-user` | `200, 400, 401, 403, 409, 422, 500` |
| `DELETE` | `/api/auth/admin/delete-mock-users` | `200, 400, 401, 403, 500` |
| `POST` | `/api/auth/admin/impersonate-user` | `200, 400, 401, 403, 409, 500` |
| `POST` | `/api/auth/admin/update-user` | `200, 400, 401, 403, 404, 409, 422, 500` |
| `GET` | `/api/auth/callback/google` | `302, 400, 500` |
| `POST` | `/api/auth/change-password` | `200, 400, 401, 403, 409, 500` |
| `POST` | `/api/auth/forget-password` | `200, 400, 409, 429, 500` |
| `GET` | `/api/auth/get-session` | `200, 400, 401, 403, 500` |
| `POST` | `/api/auth/google/revoke-calendar-access` | `204, 400, 401, 403, 409, 500, 502` |
| `POST` | `/api/auth/link-account/google` | `200, 400, 401, 403, 409, 422, 500` |
| `GET` | `/api/auth/list-sessions` | `200, 400, 401, 403, 500` |
| `POST` | `/api/auth/reset-password` | `200, 400, 409, 500` |
| `POST` | `/api/auth/revoke-session` | `200, 400, 401, 403, 409, 500` |
| `POST` | `/api/auth/select-university` | `200, 400, 401, 403, 409, 500` |
| `POST` | `/api/auth/send-verification-email` | `200, 400, 401, 403, 409, 429, 500` |
| `POST` | `/api/auth/sign-in/email` | `200, 400, 401, 409, 429, 500` |
| `POST` | `/api/auth/sign-in/guest` | `201, 400, 409, 500, 503` |
| `POST` | `/api/auth/sign-out` | `200, 400, 401, 403, 409, 500` |
| `POST` | `/api/auth/sign-up/email` | `200, 400, 409, 422, 429, 500` |
| `POST` | `/api/auth/verify-email` | `200, 400, 409, 500` |

## Builder

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/builder` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/builder` | `201, 400, 401, 403, 409, 500` |
| `POST` | `/api/builder/events` | `201, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/builder/personalModule` | `200, 400, 401, 403, 500` |
| `DELETE` | `/api/builder/{moduleId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/builder/{moduleId}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/builder/{moduleId}` | `200, 400, 401, 403, 404, 409, 500` |

## Buildings

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/buildings` | `200, 400, 401, 403, 500` |
| `POST` | `/api/buildings` | `201, 400, 401, 403, 409, 500` |
| `GET` | `/api/buildings/heatmap` | `200, 400, 401, 403, 500` |
| `DELETE` | `/api/buildings/{buildingId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/buildings/{buildingId}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/buildings/{buildingId}` | `200, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/buildings/{buildingId}/heatmap` | `200, 400, 401, 403, 404, 500` |

## Courses

| Method | Route | Documented response statuses |
|---|---|---|
| `POST` | `/api/Courses` | `201, 400, 401, 403, 409, 500` |
| `GET` | `/api/Courses/course-enrollment/{CourseId}` | `201, 400, 401, 403, 404, 500` |
| `DELETE` | `/api/Courses/course-unenrollment/{CourseId}` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/Courses/getAll` | `200, 400, 401, 403, 409, 500` |
| `GET` | `/api/Courses/statistics` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/Courses/v2/getAll` | `200, 400, 401, 403, 500` |
| `GET` | `/api/Courses/v2/{CourseId}` | `200, 400, 401, 403, 404, 500` |
| `DELETE` | `/api/Courses/{CourseId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/Courses/{CourseId}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/Courses/{CourseId}` | `200, 400, 401, 403, 404, 409, 500` |

## Events

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/events` | `200, 400, 401, 403, 500` |
| `POST` | `/api/events` | `201, 400, 401, 403, 409, 500` |
| `GET` | `/api/events/statistics/venue` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/events/statistics/week` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/events/v2` | `201, 400, 401, 403, 409, 500` |
| `PATCH` | `/api/events/validate/{id}` | `200, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/events/{eventId}` | `200, 400, 401, 403, 404, 500` |
| `DELETE` | `/api/events/{id}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/events/{id}` | `200, 400, 401, 403, 404, 409, 500` |
| `PATCH` | `/api/events/{id}/venue` | `200, 400, 401, 403, 404, 409, 500` |

## Grouping

| Method | Route | Documented response statuses |
|---|---|---|
| `PATCH` | `/api/grouping/{groupId}` | `201, 400, 401, 403, 404, 409, 500` |

## Health

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/health` | `200, 400, 500` |
| `GET` | `/api/health/check` | `200, 400, 500` |

## Map Config

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/map-config` | `200, 400, 401, 403, 404, 500` |
| `PUT` | `/api/map-config` | `200, 400, 401, 403, 409, 500` |

## Modules

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/modules` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/modules` | `201, 400, 401, 403, 409, 500` |
| `GET` | `/api/modules/enroll/{moduleId}` | `200, 201, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/modules/enroll/{moduleId}` | `200, 201, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/modules/statistics` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/modules/styling/{moduleId}` | `200, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/modules/v2` | `200, 400, 401, 403, 500` |
| `POST` | `/api/modules/v2` | `201, 400, 401, 403, 409, 500` |
| `GET` | `/api/modules/v2/{moduleId}` | `200, 400, 401, 403, 404, 500` |
| `PUT` | `/api/modules/{CourseID}` | `200, 400, 401, 403, 404, 409, 500` |
| `DELETE` | `/api/modules/{moduleId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/modules/{moduleId}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/modules/{moduleId}` | `200, 400, 401, 403, 404, 409, 500` |

## PDF Parser

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/pdf-parser/demo-pdf` | `200, 400, 401, 403, 500` |
| `POST` | `/api/pdf-parser/jobs/lookup` | `200, 400, 401, 403, 409, 500` |
| `POST` | `/api/pdf-parser/jobs/upload` | `202, 400, 401, 403, 409, 500` |
| `GET` | `/api/pdf-parser/jobs/{jobId}` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/pdf-parser/jobs/{jobId}/callback` | `202, 400, 401, 404, 409, 500` |
| `GET` | `/api/pdf-parser/jobs/{jobId}/result` | `200, 400, 401, 403, 404, 500` |

## Routes

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/routes` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/routes/active` | `200, 400, 401, 403, 500` |
| `PUT` | `/api/routes/diversion` | `200, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/routes/heatmap` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/routes/stop-route` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/routes/variant` | `200, 400, 401, 403, 500` |

## Solver

| Method | Route | Documented response statuses |
|---|---|---|
| `POST` | `/api/solver/jobs` | `202, 400, 401, 403, 409, 500` |
| `GET` | `/api/solver/jobs/{jobId}` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/solver/jobs/{jobId}/callback` | `202, 400, 401, 404, 409, 500` |
| `GET` | `/api/solver/jobs/{jobId}/input` | `200, 400, 401, 404, 500` |
| `GET` | `/api/solver/jobs/{jobId}/result` | `200, 400, 401, 403, 404, 500` |

## Student Routes

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/routes/student` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/routes/student/alternatives` | `200, 400, 401, 403, 404, 500` |

## Teaches

| Method | Route | Documented response statuses |
|---|---|---|
| `POST` | `/api/teaches` | `201, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/teaches/me/modules` | `200, 400, 401, 403, 500` |
| `POST` | `/api/teaches/me/modules` | `201, 400, 401, 403, 409, 500` |

## Timetables

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/timetables` | `200, 400, 401, 403, 500` |
| `POST` | `/api/timetables` | `201, 400, 401, 403, 409, 500` |
| `GET` | `/api/timetables/v2` | `200, 400, 401, 403, 500` |
| `GET` | `/api/timetables/v2/{id}` | `200, 400, 401, 403, 404, 500` |
| `DELETE` | `/api/timetables/{id}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/timetables/{id}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/timetables/{id}` | `200, 400, 401, 403, 404, 409, 500` |

## Universities

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/universities` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/universities` | `201, 400, 401, 403, 409, 500` |
| `POST` | `/api/universities/applications/{universityID}` | `200, 400, 401, 403, 409, 500` |
| `POST` | `/api/universities/apply` | `201, 400, 401, 403, 404, 409, 500` |
| `POST` | `/api/universities/approve` | `201, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/universities/role/{universityId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/universities/statistics` | `200, 400, 401, 403, 404, 500` |
| `DELETE` | `/api/universities/{universityId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/universities/{universityId}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/universities/{universityId}` | `200, 400, 401, 403, 404, 409, 500` |

## Venues

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/venues` | `200, 400, 401, 403, 500` |
| `POST` | `/api/venues` | `201, 400, 401, 403, 409, 500` |
| `POST` | `/api/venues/assign` | `200, 400, 401, 403, 409, 500` |
| `DELETE` | `/api/venues/{venueId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/venues/{venueId}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/venues/{venueId}` | `200, 400, 401, 403, 404, 409, 500` |

## Vision Sessions

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/vision-sessions` | `200, 400, 401, 403, 500` |
| `POST` | `/api/vision-sessions` | `201, 400, 401, 403, 409, 500` |
| `DELETE` | `/api/vision-sessions/{sessionId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/vision-sessions/{sessionId}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/vision-sessions/{sessionId}` | `200, 400, 401, 403, 404, 409, 500` |
