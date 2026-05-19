/\*\*

- BetterAuth API Endpoints Documentation
-
- This file documents all auth endpoints provided by BetterAuth.
- Base path: /api/auth/
-
- BetterAuth automatically handles all endpoints below.
- Responses include Set-Cookie headers for session management.
  \*/

// ============================================================================
// SIGN UP / REGISTRATION
// ============================================================================

/\*\*

- POST /api/auth/sign-up/email
- Register a new user with email and password
-
- Request:
- {
- "email": "user@example.com",
- "password": "secure-password",
- "name": "User Name"
- }
-
- Success Response (200):
- {
- "user": {
-     "id": "uuid",
-     "email": "user@example.com",
-     "name": "User Name",
-     "emailVerified": false,
-     "image": null,
-     "role": "student",
-     "banned": false,
-     "timezone": "Africa/Johannesburg",
-     "createdAt": "2024-01-01T00:00:00Z",
-     "updatedAt": "2024-01-01T00:00:00Z"
- },
- "session": {
-     "id": "uuid",
-     "token": "auth-token",
-     "userId": "uuid",
-     "expiresAt": "2024-02-01T00:00:00Z",
-     "createdAt": "2024-01-01T00:00:00Z",
-     "updatedAt": "2024-01-01T00:00:00Z"
- }
- }
- Headers: Set-Cookie: umtas-session=...
-
- Error Responses:
- 400: { error: "INVALID_EMAIL" } - Invalid email format
- 400: { error: "WEAK_PASSWORD" } - Password too short (min 8 chars)
- 422: { error: "USER_EMAIL_ALREADY_EXISTS" } - Email already registered
- 429: Rate limited - max 100 requests per 60 seconds
  \*/

// ============================================================================
// SIGN IN / LOGIN
// ============================================================================

/\*\*

- POST /api/auth/sign-in/email
- Authenticate user with email and password
-
- Request:
- {
- "email": "user@example.com",
- "password": "secure-password"
- }
-
- Success Response (200):
- {
- "user": { ...user object... },
- "session": { ...session object... }
- }
- Headers: Set-Cookie: umtas-session=...
-
- Error Responses:
- 401: { error: "INVALID_EMAIL_OR_PASSWORD" } - Wrong credentials
- 400: { error: "EMAIL_NOT_VERIFIED" } - Must verify email first
- 429: Rate limited
  \*/

// ============================================================================
// SIGN OUT / LOGOUT
// ============================================================================

/\*\*

- POST /api/auth/sign-out
- Terminate the current session
-
- Headers: Cookie: umtas-session=... (required)
-
- Success Response (200):
- { }
- Headers: Set-Cookie: umtas-session=; Max-Age=0; (clears cookie)
-
- Error Responses:
- 401: { error: "UNAUTHORIZED" } - No active session
  \*/

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/\*\*

- GET /api/auth/session
- Get current user session
-
- Headers: Cookie: umtas-session=... (required)
-
- Success Response (200):
- {
- "user": { ...user object... },
- "session": { ...session object... }
- }
-
- Error Responses:
- 401: null - No active session
  \*/

/\*\*

- GET /api/auth/list-sessions
- List all active sessions for current user
-
- Headers: Cookie: umtas-session=... (required)
-
- Success Response (200):
- [
- {
-     "id": "session-uuid",
-     "token": "session-token",
-     "userId": "user-uuid",
-     "expiresAt": "2024-02-01T00:00:00Z",
-     "ipAddress": "192.168.1.1",
-     "userAgent": "Mozilla/5.0...",
-     "createdAt": "2024-01-01T00:00:00Z",
-     "updatedAt": "2024-01-01T00:00:00Z"
- }
- ]
-
- Error Responses:
- 401: { error: "UNAUTHORIZED" }
  \*/

/\*\*

- POST /api/auth/revoke-session
- Terminate a specific session by ID
-
- Headers: Cookie: umtas-session=... (required)
- Request:
- { "sessionId": "session-uuid" }
-
- Success Response (200):
- { }
-
- Error Responses:
- 401: { error: "UNAUTHORIZED" }
- 400: { error: "SESSION_NOT_FOUND" }
  \*/

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

/\*\*

- POST /api/auth/send-verification-email
- Send verification email to user
-
- Headers: Cookie: umtas-session=... (required)
-
- Success Response (200):
- { }
-
- Error Responses:
- 401: { error: "UNAUTHORIZED" }
- 400: { error: "EMAIL_ALREADY_VERIFIED" }
- 429: Rate limited
  \*/

/\*\*

- POST /api/auth/verify-email
- Verify email with code from verification email
-
- Request:
- {
- "code": "verification-code-from-email",
- "email": "user@example.com"
- }
-
- Success Response (200):
- {
- "user": { ...user object with emailVerified: true... },
- "session": { ...session object... }
- }
- Headers: Set-Cookie: umtas-session=... (may be set automatically)
-
- Error Responses:
- 400: { error: "INVALID_CODE" } - Wrong or expired code
- 400: { error: "EMAIL_NOT_FOUND" }
  \*/

// ============================================================================
// PASSWORD RESET
// ============================================================================

/\*\*

- POST /api/auth/forget-password
- Request password reset email
-
- Request:
- { "email": "user@example.com" }
-
- Success Response (200):
- { }
-
- Note: Always returns 200 for security (doesn't reveal if email exists)
- Email sent to: user@example.com with reset link valid for 1 hour
- Error Responses:
- 429: Rate limited
  \*/

/\*\*

- POST /api/auth/reset-password
- Reset password with token from reset email
-
- Request:
- {
- "token": "reset-token-from-email",
- "newPassword": "new-secure-password"
- }
-
- Success Response (200):
- {
- "user": { ...user object... },
- "session": { ...session object... }
- }
- Headers: Set-Cookie: umtas-session=... (signs user in after reset)
-
- Error Responses:
- 400: { error: "INVALID_TOKEN" } - Token expired or wrong
- 400: { error: "WEAK_PASSWORD" }
  \*/

// ============================================================================
// CHANGE PASSWORD
// ============================================================================

/\*\*

- POST /api/auth/change-password
- Change password for authenticated user
-
- Headers: Cookie: umtas-session=... (required)
- Request:
- {
- "currentPassword": "current-password",
- "newPassword": "new-secure-password"
- }
-
- Success Response (200):
- { }
-
- Error Responses:
- 401: { error: "UNAUTHORIZED" }
- 400: { error: "INVALID_PASSWORD" } - Current password wrong
- 400: { error: "WEAK_PASSWORD" }
  \*/

// ============================================================================
// SOCIAL LOGIN (OAUTH)
// ============================================================================

/\*\*

- GET /api/auth/callback/google
- Google OAuth callback (auto-redirected from Google)
-
- Query params (set by Google):
- ?code=google-auth-code&state=...
-
- Success Response (302 redirect):
- Redirects to: NEXT_PUBLIC_APP_URL (frontend home)
- Headers: Set-Cookie: umtas-session=...
-
- New users are auto-registered with role "student"
- Existing users are logged in
-
- Error Responses:
- 302 Redirect to error page if OAuth fails
  \*/

/\*\*

- POST /api/auth/callback/google
- Google OAuth callback (POST variant)
-
- Request:
- {
- "code": "google-auth-code",
- "state": "..."
- }
-
- Success Response (200):
- {
- "user": { ...user object... },
- "session": { ...session object... }
- }
- Headers: Set-Cookie: umtas-session=...
-
- Error Responses:
- 400: { error: "INVALID_CODE" }
  \*/

// ============================================================================
// ACCOUNT LINKING
// ============================================================================

/\*\*

- POST /api/auth/link-account/google
- Link Google account to existing email/password account
-
- Headers: Cookie: umtas-session=... (required)
- Request:
- {
- "code": "google-auth-code",
- "state": "..."
- }
-
- Success Response (200):
- {
- "user": { ...user object... },
- "session": { ...session object... }
- }
-
- Error Responses:
- 401: { error: "UNAUTHORIZED" }
- 400: { error: "ACCOUNT_ALREADY_LINKED" }
- 422: { error: "EMAIL_ALREADY_IN_USE" }
  \*/

// ============================================================================
// USER MANAGEMENT (Admin endpoints - require appropriate role)
// ============================================================================

/\*\*

- POST /api/auth/admin/create-user
- Create a new user (admin only)
-
- Headers: Cookie: umtas-session=... (required, user must be sys_admin)
- Request:
- {
- "email": "newuser@example.com",
- "password": "secure-password",
- "name": "User Name",
- "role": "student" | "uni_admin" | "sys_admin"
- }
-
- Success Response (200):
- { "user": { ...user object... } }
-
- Error Responses:
- 401: { error: "UNAUTHORIZED" }
- 403: { error: "INSUFFICIENT_PERMISSIONS" } - User not admin
- 422: { error: "USER_EMAIL_ALREADY_EXISTS" }
  \*/

/\*\*

- POST /api/auth/admin/ban-user
- Ban user from the system (admin only)
-
- Headers: Cookie: umtas-session=... (required)
- Request:
- {
- "userId": "user-uuid",
- "reason": "Reason for banning",
- "banExpiresAt": "2024-02-01T00:00:00Z" (optional, null = permanent)
- }
-
- Success Response (200):
- { "user": { ...user object with banned: true... } }
-
- Error Responses:
- 401: { error: "UNAUTHORIZED" }
- 403: { error: "INSUFFICIENT_PERMISSIONS" }
- 404: { error: "USER_NOT_FOUND" }
  \*/

/\*\*

- POST /api/auth/admin/update-user
- Update user details (admin only)
-
- Headers: Cookie: umtas-session=... (required)
- Request:
- {
- "userId": "user-uuid",
- "name": "New Name", (optional)
- "email": "newemail@example.com", (optional)
- "role": "uni_admin" (optional)
- }
-
- Success Response (200):
- { "user": { ...updated user object... } }
-
- Error Responses:
- 401: { error: "UNAUTHORIZED" }
- 403: { error: "INSUFFICIENT_PERMISSIONS" }
- 404: { error: "USER_NOT_FOUND" }
- 422: { error: "EMAIL_ALREADY_IN_USE" }
  \*/

// ============================================================================
// COMMON ERROR CODES
// ============================================================================

/\*\*

- Error Response Format:
- All errors return JSON with structure:
- {
- "error": "ERROR_CODE",
- "details": "Human readable message" (optional)
- }
-
- Common Errors:
- - INVALID_EMAIL: Email format validation failed
- - INVALID_PASSWORD: Password validation failed
- - WEAK_PASSWORD: Password doesn't meet min requirements (8+ chars)
- - USER_EMAIL_ALREADY_EXISTS: Email already has account
- - USER_NOT_FOUND: User doesn't exist
- - INVALID_EMAIL_OR_PASSWORD: Login failed
- - EMAIL_NOT_VERIFIED: Must verify email before login
- - UNAUTHORIZED: No valid session
- - INSUFFICIENT_PERMISSIONS: User role lacks required permissions
- - INVALID_CODE: Verification/reset code is invalid or expired
- - SESSION_NOT_FOUND: Session ID doesn't exist
- - ACCOUNT_ALREADY_LINKED: Social account already linked
- - EMAIL_ALREADY_IN_USE: Email used by another account
- - INVALID_TOKEN: Token is invalid or expired
    \*/
