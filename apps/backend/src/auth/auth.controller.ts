import { All, Controller, Get, Logger, Post, Req, Res } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AuthService } from './auth.service';
import {
  AdminBanUserDto,
  AdminCreateUserDto,
  AdminUpdateUserDto,
  ChangePasswordDto,
  ForgetPasswordDto,
  LinkGoogleAccountDto,
  ResetPasswordDto,
  RevokeSessionDto,
  SignInEmailDto,
  SignUpEmailDto,
  VerifyEmailDto,
} from './auth.dto';

const USER_EXAMPLE = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  email: 'user@example.com',
  name: 'John Doe',
  emailVerified: false,
  image: null,
  role: 'student',
  banned: false,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const SESSION_EXAMPLE = {
  id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  token: 'session-token-value',
  userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  expiresAt: '2025-02-01T00:00:00Z',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0 (compatible browser)',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const AUTH_RESPONSE_EXAMPLE = { user: USER_EXAMPLE, session: SESSION_EXAMPLE };

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  // ─── Registration ─────────────────────────────────────────────────────────────

  @Post('sign-up/email')
  @ApiOperation({
    summary: 'Register with email and password',
    operationId: 'signUpEmail',
  })
  @ApiBody({ type: SignUpEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Registration successful. Sets the umtas-session cookie.',
    schema: { example: AUTH_RESPONSE_EXAMPLE },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email format or password too weak (min 8 characters)',
    schema: { example: { error: 'INVALID_EMAIL' } },
  })
  @ApiResponse({
    status: 422,
    description: 'Email already registered',
    schema: { example: { error: 'USER_EMAIL_ALREADY_EXISTS' } },
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limited — max 100 requests per 60 seconds',
  })
  async signUpEmail(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  // ─── Sign in ──────────────────────────────────────────────────────────────────

  @Post('sign-in/email')
  @ApiOperation({
    summary: 'Sign in with email and password',
    operationId: 'signInEmail',
  })
  @ApiBody({ type: SignInEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Sign-in successful. Sets the umtas-session cookie.',
    schema: { example: AUTH_RESPONSE_EXAMPLE },
  })
  @ApiResponse({
    status: 400,
    description: 'Email not verified — must verify before signing in',
    schema: { example: { error: 'EMAIL_NOT_VERIFIED' } },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
    schema: { example: { error: 'INVALID_EMAIL_OR_PASSWORD' } },
  })
  @ApiResponse({ status: 429, description: 'Rate limited' })
  async signInEmail(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  // ─── Sign out ─────────────────────────────────────────────────────────────────

  @Post('sign-out')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Sign out and invalidate the current session',
    operationId: 'signOut',
  })
  @ApiResponse({
    status: 200,
    description: 'Signed out. The umtas-session cookie is cleared.',
    schema: { example: {} },
  })
  @ApiResponse({
    status: 401,
    description: 'No active session',
    schema: { example: { error: 'UNAUTHORIZED' } },
  })
  async signOut(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  // ─── Session management ───────────────────────────────────────────────────────

  @Get('session')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Get the current user session',
    operationId: 'getSession',
  })
  @ApiResponse({
    status: 200,
    description: 'Active session returned. Returns null if no session exists.',
    schema: { example: AUTH_RESPONSE_EXAMPLE },
  })
  @ApiResponse({
    status: 401,
    description: 'No active session',
    schema: { example: null },
  })
  async getSession(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  @Get('list-sessions')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'List all active sessions for the current user',
    operationId: 'listSessions',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of active sessions for this user',
    schema: { example: [SESSION_EXAMPLE] },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: { example: { error: 'UNAUTHORIZED' } },
  })
  async listSessions(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  @Post('revoke-session')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Terminate a specific session by ID',
    operationId: 'revokeSession',
  })
  @ApiBody({ type: RevokeSessionDto })
  @ApiResponse({
    status: 200,
    description: 'Session revoked',
    schema: { example: {} },
  })
  @ApiResponse({
    status: 400,
    description: 'Session not found',
    schema: { example: { error: 'SESSION_NOT_FOUND' } },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: { example: { error: 'UNAUTHORIZED' } },
  })
  async revokeSession(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  // ─── Email verification ───────────────────────────────────────────────────────

  @Post('send-verification-email')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Send a verification email to the signed-in user',
    operationId: 'sendVerificationEmail',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent',
    schema: { example: {} },
  })
  @ApiResponse({
    status: 400,
    description: 'Email already verified',
    schema: { example: { error: 'EMAIL_ALREADY_VERIFIED' } },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: { example: { error: 'UNAUTHORIZED' } },
  })
  @ApiResponse({ status: 429, description: 'Rate limited' })
  async sendVerificationEmail(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  @Post('verify-email')
  @ApiOperation({
    summary: 'Verify email address using the code from the verification email',
    operationId: 'verifyEmail',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified. User is signed in automatically.',
    schema: { example: AUTH_RESPONSE_EXAMPLE },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification code, or email not found',
    schema: { example: { error: 'INVALID_CODE' } },
  })
  async verifyEmail(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  // ─── Password reset ───────────────────────────────────────────────────────────

  @Post('forget-password')
  @ApiOperation({
    summary: 'Request a password reset email',
    operationId: 'forgetPassword',
  })
  @ApiBody({ type: ForgetPasswordDto })
  @ApiResponse({
    status: 200,
    description:
      'Reset email sent. Always returns 200 — does not reveal whether the email exists.',
    schema: { example: {} },
  })
  @ApiResponse({ status: 429, description: 'Rate limited' })
  async forgetPassword(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password using the token from the reset email',
    operationId: 'resetPassword',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset. User is signed in automatically.',
    schema: { example: AUTH_RESPONSE_EXAMPLE },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token, or new password too weak',
    schema: { example: { error: 'INVALID_TOKEN' } },
  })
  async resetPassword(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  // ─── Change password ──────────────────────────────────────────────────────────

  @Post('change-password')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Change password for the signed-in user',
    operationId: 'changePassword',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: { example: {} },
  })
  @ApiResponse({
    status: 400,
    description: 'Incorrect current password or new password too weak',
    schema: { example: { error: 'INVALID_PASSWORD' } },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: { example: { error: 'UNAUTHORIZED' } },
  })
  async changePassword(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────────

  @Get('callback/google')
  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Handles the redirect from Google after OAuth authorisation. Not intended to be called directly — Google redirects the browser here automatically.',
    operationId: 'googleOAuthCallback',
  })
  @ApiQuery({
    name: 'code',
    required: true,
    description: 'Authorization code issued by Google',
    example: '4/0AX4XfWj...',
  })
  @ApiQuery({
    name: 'state',
    required: true,
    description: 'OAuth state parameter set by BetterAuth',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to the frontend app. Sets the umtas-session cookie.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OAuth code',
    schema: { example: { error: 'INVALID_CODE' } },
  })
  async googleOAuthCallback(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  @Post('link-account/google')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Link a Google account to the current user',
    operationId: 'linkGoogleAccount',
  })
  @ApiBody({ type: LinkGoogleAccountDto })
  @ApiResponse({
    status: 200,
    description: 'Google account linked',
    schema: { example: AUTH_RESPONSE_EXAMPLE },
  })
  @ApiResponse({
    status: 400,
    description: 'Account already linked or invalid OAuth code',
    schema: { example: { error: 'ACCOUNT_ALREADY_LINKED' } },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: { example: { error: 'UNAUTHORIZED' } },
  })
  @ApiResponse({
    status: 422,
    description:
      'The Google account email is already in use by another account',
    schema: { example: { error: 'EMAIL_ALREADY_IN_USE' } },
  })
  async linkGoogleAccount(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────────

  @Post('admin/create-user')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Create a new user — requires sys_admin role',
    operationId: 'adminCreateUser',
  })
  @ApiBody({ type: AdminCreateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User created',
    schema: { example: { user: USER_EXAMPLE } },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: { example: { error: 'UNAUTHORIZED' } },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (sys_admin required)',
    schema: { example: { error: 'INSUFFICIENT_PERMISSIONS' } },
  })
  @ApiResponse({
    status: 422,
    description: 'Email already registered',
    schema: { example: { error: 'USER_EMAIL_ALREADY_EXISTS' } },
  })
  async adminCreateUser(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  @Post('admin/ban-user')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Ban a user — requires sys_admin role',
    operationId: 'adminBanUser',
  })
  @ApiBody({ type: AdminBanUserDto })
  @ApiResponse({
    status: 200,
    description: 'User banned',
    schema: { example: { user: { ...USER_EXAMPLE, banned: true } } },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: { example: { error: 'UNAUTHORIZED' } },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (sys_admin required)',
    schema: { example: { error: 'INSUFFICIENT_PERMISSIONS' } },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: { example: { error: 'USER_NOT_FOUND' } },
  })
  async adminBanUser(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  @Post('admin/update-user')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: "Update a user's details — requires sys_admin role",
    operationId: 'adminUpdateUser',
  })
  @ApiBody({ type: AdminUpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated',
    schema: { example: { user: USER_EXAMPLE } },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: { example: { error: 'UNAUTHORIZED' } },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (sys_admin required)',
    schema: { example: { error: 'INSUFFICIENT_PERMISSIONS' } },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: { example: { error: 'USER_NOT_FOUND' } },
  })
  @ApiResponse({
    status: 422,
    description: 'New email already in use',
    schema: { example: { error: 'EMAIL_ALREADY_IN_USE' } },
  })
  async adminUpdateUser(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  // ─── Catch-all for internal BetterAuth routes ─────────────────────────────────

  @All('*')
  @ApiExcludeEndpoint()
  async handler(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    try {
      const auth = this.authService.getAuth();
      const { toNodeHandler } = await import('better-auth/node');
      const nodeHandler = toNodeHandler(auth.handler);
      await nodeHandler(req, res);
    } catch (error) {
      this.logger.error('Auth handler error', error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal auth error' }));
      }
    }
  }
}
