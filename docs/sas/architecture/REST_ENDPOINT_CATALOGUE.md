# REST Endpoint Catalogue

This static catalogue is generated from `apps/backend/docs/openapi.json`. Request and response schemas, parameters, examples, security requirements, and standard error bodies remain normative in that committed OpenAPI document. The live Swagger UI is a rendered convenience.

**Source reviewed:** 3 September 2026  
**Operations:** 115

## Academic Calendar

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/academic-calendar` | `200, 400, 401, 403, 500` |
| `POST` | `/api/academic-calendar` | `201, 400, 401, 403, 409, 500` |
| `DELETE` | `/api/academic-calendar/{id}` | `200, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/academic-calendar/{id}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/academic-calendar/{id}/restrictions` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/academic-calendar/{id}/restrictions` | `201, 400, 401, 403, 404, 409, 422, 500` |
| `DELETE` | `/api/academic-calendar/{id}/restrictions/{restrictionId}` | `200, 400, 401, 403, 404, 500` |
| `PUT` | `/api/academic-calendar/{id}/restrictions/{restrictionId}` | `200, 400, 401, 403, 404, 409, 422, 500` |
| `PUT` | `/api/academic-calendar/{id}/subscriptions` | `200, 400, 401, 403, 404, 409, 422, 500` |
| `POST` | `/api/academic-calendar/generate` | `201, 400, 401, 403, 404, 409, 422, 500` |
| `GET` | `/api/academic-calendar/generated/{id}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/academic-calendar/public` | `200, 400, 401, 403, 500` |

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
| `POST` | `/api/auth/link-account/google` | `200, 400, 401, 403, 409, 422, 500` |
| `GET` | `/api/auth/list-sessions` | `200, 400, 401, 403, 500` |
| `POST` | `/api/auth/reset-password` | `200, 400, 409, 500` |
| `POST` | `/api/auth/revoke-session` | `200, 400, 401, 403, 409, 500` |
| `POST` | `/api/auth/select-university` | `200, 400, 401, 403, 409, 500` |
| `POST` | `/api/auth/send-verification-email` | `200, 400, 401, 403, 409, 429, 500` |
| `POST` | `/api/auth/sign-in/email` | `200, 400, 401, 409, 429, 500` |
| `POST` | `/api/auth/sign-out` | `200, 400, 401, 403, 409, 500` |
| `POST` | `/api/auth/sign-up/email` | `200, 400, 409, 422, 429, 500` |
| `POST` | `/api/auth/verify-email` | `200, 400, 409, 500` |

## Builder

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/builder` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/builder` | `201, 400, 401, 403, 409, 500` |
| `DELETE` | `/api/builder/{moduleId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/builder/{moduleId}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/builder/{moduleId}` | `200, 400, 401, 403, 404, 409, 500` |
| `POST` | `/api/builder/events` | `201, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/builder/personalModule` | `200, 400, 401, 403, 500` |

## Buildings

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/buildings` | `200, 400, 401, 403, 500` |
| `POST` | `/api/buildings` | `201, 400, 401, 403, 409, 500` |
| `PATCH` | `/api/buildings/{buildingId}` | `200, 400, 401, 403, 404, 409, 500` |

## Courses

| Method | Route | Documented response statuses |
|---|---|---|
| `POST` | `/api/Courses` | `201, 400, 401, 403, 409, 500` |
| `DELETE` | `/api/Courses/{CourseId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/Courses/{CourseId}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/Courses/{CourseId}` | `200, 400, 401, 403, 404, 409, 500` |
| `POST` | `/api/Courses/getAll` | `200, 400, 401, 403, 409, 500` |
| `GET` | `/api/Courses/v2/{CourseId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/Courses/v2/getAll` | `200, 400, 401, 403, 500` |

## Events

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/events` | `200, 400, 401, 403, 500` |
| `POST` | `/api/events` | `201, 400, 401, 403, 409, 500` |
| `GET` | `/api/events/{eventId}` | `200, 400, 401, 403, 404, 500` |
| `DELETE` | `/api/events/{id}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/events/{id}` | `200, 400, 401, 403, 404, 409, 500` |
| `PATCH` | `/api/events/{id}/venue` | `200, 400, 401, 403, 404, 409, 500` |
| `POST` | `/api/events/v2` | `201, 400, 401, 403, 409, 500` |
| `PATCH` | `/api/events/validate/{id}` | `200, 400, 401, 403, 404, 409, 500` |

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
| `PUT` | `/api/modules/{CourseID}` | `200, 400, 401, 403, 404, 409, 500` |
| `DELETE` | `/api/modules/{moduleId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/modules/{moduleId}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/modules/{moduleId}` | `200, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/modules/enroll/{moduleId}` | `200, 201, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/modules/enroll/{moduleId}` | `200, 201, 400, 401, 403, 404, 409, 500` |
| `POST` | `/api/modules/styling/{moduleId}` | `200, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/modules/v2` | `200, 400, 401, 403, 500` |
| `POST` | `/api/modules/v2` | `201, 400, 401, 403, 409, 500` |
| `GET` | `/api/modules/v2/{moduleId}` | `200, 400, 401, 403, 404, 500` |

## PDF Parser

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/pdf-parser/jobs/{jobId}` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/pdf-parser/jobs/{jobId}/callback` | `202, 400, 401, 404, 409, 500` |
| `GET` | `/api/pdf-parser/jobs/{jobId}/result` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/pdf-parser/jobs/lookup` | `200, 400, 401, 403, 409, 500` |
| `POST` | `/api/pdf-parser/jobs/upload` | `202, 400, 401, 403, 409, 500` |

## Routes

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/routes` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/routes/active` | `200, 400, 401, 403, 500` |

## Solver

| Method | Route | Documented response statuses |
|---|---|---|
| `POST` | `/api/solver/jobs` | `202, 400, 401, 403, 409, 500` |
| `GET` | `/api/solver/jobs/{jobId}` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/solver/jobs/{jobId}/callback` | `202, 400, 401, 404, 409, 500` |
| `GET` | `/api/solver/jobs/{jobId}/input` | `200, 400, 401, 404, 500` |
| `GET` | `/api/solver/jobs/{jobId}/result` | `200, 400, 401, 403, 404, 500` |

## Timetables

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/timetables` | `200, 400, 401, 403, 500` |
| `POST` | `/api/timetables` | `201, 400, 401, 403, 409, 500` |
| `DELETE` | `/api/timetables/{id}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/timetables/{id}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/timetables/{id}` | `200, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/timetables/v2` | `200, 400, 401, 403, 500` |
| `GET` | `/api/timetables/v2/{id}` | `200, 400, 401, 403, 404, 500` |

## Universities

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/universities` | `200, 400, 401, 403, 404, 500` |
| `POST` | `/api/universities` | `201, 400, 401, 403, 409, 500` |
| `DELETE` | `/api/universities/{universityId}` | `200, 400, 401, 403, 404, 500` |
| `GET` | `/api/universities/{universityId}` | `200, 400, 401, 403, 404, 500` |
| `PATCH` | `/api/universities/{universityId}` | `200, 400, 401, 403, 404, 409, 500` |
| `POST` | `/api/universities/applications/{universityID}` | `200, 400, 401, 403, 409, 500` |
| `POST` | `/api/universities/apply` | `201, 400, 401, 403, 404, 409, 500` |
| `POST` | `/api/universities/approve` | `201, 400, 401, 403, 404, 409, 500` |
| `GET` | `/api/universities/role/{universityId}` | `200, 400, 401, 403, 404, 500` |

## Venues

| Method | Route | Documented response statuses |
|---|---|---|
| `GET` | `/api/venues` | `200, 400, 401, 403, 500` |
| `PATCH` | `/api/venues/{venueId}/building` | `200, 400, 401, 403, 404, 409, 500` |
| `POST` | `/api/venues/assign` | `200, 400, 401, 403, 409, 500` |


