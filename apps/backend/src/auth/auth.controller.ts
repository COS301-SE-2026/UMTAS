import {
  All,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { toNodeHandler } from 'better-auth/node';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'stream';
import { AuthService } from './auth.service';
import { Public } from './auth.guard';
import { RequiresFreshSession } from './fresh-session.guard';
import {
  AdminBanUserDto,
  AdminCreateUserDto,
  AdminImpersonateUserDto,
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
  email: 'system-admin@local.umtas',
  name: 'System Admin',
  emailVerified: true,
  image: null,
  role: 'sys_admin',
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

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  // ─── Registration ─────────────────────────────────────────────────────────────

  @Public()
  @ApiTags('Auth Email')
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
    description: 'Rate limited - max 100 requests per 60 seconds',
  })
  async signUpEmail(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  // ─── Sign in ──────────────────────────────────────────────────────────────────

  @Public()
  @ApiTags('Auth Email')
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
    description: 'Email not verified - must verify before signing in',
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

  @ApiTags('Auth Session')
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

  @Public()
  @ApiTags('Auth Session')
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

  @ApiTags('Auth Session')
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

  @ApiTags('Auth Session')
  @Post('revoke-session')
  @RequiresFreshSession()
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

  @ApiTags('Auth Email')
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

  @Public()
  @ApiTags('Auth Email')
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

  @Public()
  @ApiTags('Auth Email')
  @Post('forget-password')
  @ApiOperation({
    summary: 'Request a password reset email',
    operationId: 'forgetPassword',
  })
  @ApiBody({ type: ForgetPasswordDto })
  @ApiResponse({
    status: 200,
    description:
      'Reset email sent. Always returns 200 - does not reveal whether the email exists.',
    schema: { example: {} },
  })
  @ApiResponse({ status: 429, description: 'Rate limited' })
  async forgetPassword(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    let email = '<unknown>';
    let reqForBetterAuth: IncomingMessage = req;

    // NestJS body-parser middleware consumes the stream and sets req.body.
    // Prefer that; only fall back to stream reading if body-parser is disabled.
    const preParsed = (req as unknown as { body?: Record<string, unknown> })
      .body;
    if (typeof preParsed?.email === 'string') {
      email = preParsed.email;
      // req stream already consumed; BetterAuth also reads req.body, so pass original
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(
          Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string),
        );
      }
      const rawBody = Buffer.concat(chunks);
      try {
        const parsed = JSON.parse(rawBody.toString()) as Record<
          string,
          unknown
        >;
        if (typeof parsed.email === 'string') email = parsed.email;
      } catch {
        // Non-JSON body - fall through
      }
      // Re-inject buffered body so BetterAuth can read the stream
      reqForBetterAuth = Object.assign(Readable.from([rawBody]), {
        headers: req.headers,
        method: req.method,
        url: req.url,
        socket: req.socket,
        httpVersion: req.httpVersion,
        httpVersionMajor: req.httpVersionMajor,
        httpVersionMinor: req.httpVersionMinor,
        complete: req.complete,
        rawHeaders: req.rawHeaders,
        trailers: req.trailers,
        rawTrailers: req.rawTrailers,
      }) as unknown as IncomingMessage;
    }

    const found = await this.authService.userExistsByEmail(email);
    this.logger.log(
      `Password reset requested for ${email}: ${found ? 'found' : 'not found'}`,
    );

    if (!found) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({}));
      return;
    }

    // BetterAuth v1.6.9 renamed /forget-password → /request-password-reset.
    // The client still calls /forget-password (camelCase proxy convention), so
    // we rewrite the URL here to match the actual server-side route.
    reqForBetterAuth.url = reqForBetterAuth.url?.replace(
      'forget-password',
      'request-password-reset',
    );

    return this.handleRequest(reqForBetterAuth, res);
  }

  @Public()
  @ApiTags('Auth Email')
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

  @ApiTags('Auth Email')
  @Post('change-password')
  @RequiresFreshSession()
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

  @Public()
  @ApiTags('Auth Google')
  @Get('callback/google')
  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Handles the redirect from Google after OAuth authorisation. Not intended to be called directly - Google redirects the browser here automatically.',
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
    if (!this.hasGoogleOAuth()) {
      throw new NotFoundException('Google OAuth is not configured');
    }
    this.logger.log('Google OAuth callback received');
    return this.handleRequest(req, res);
  }

  @ApiTags('Auth Google')
  @Post('link-account/google')
  @RequiresFreshSession()
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
    if (!this.hasGoogleOAuth()) {
      throw new NotFoundException('Google OAuth is not configured');
    }
    return this.handleRequest(req, res);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────────

  @ApiTags('Auth Admin')
  @Post('admin/create-user')
  @RequiresFreshSession()
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Create a new user - requires sys_admin role',
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

  @ApiTags('Auth Admin')
  @Post('admin/impersonate-user')
  @RequiresFreshSession()
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Impersonate a user - requires sys_admin role',
    operationId: 'adminImpersonateUser',
  })
  @ApiBody({ type: AdminImpersonateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Impersonation successful. Sets a new session cookie.',
    schema: { example: AUTH_RESPONSE_EXAMPLE },
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
  async adminImpersonateUser(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  @ApiTags('Auth Admin')
  @Post('admin/ban-user')
  @RequiresFreshSession()
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Ban a user - requires sys_admin role',
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

  @ApiTags('Auth Admin')
  @Post('admin/update-user')
  @RequiresFreshSession()
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: "Update a user's details - requires sys_admin role",
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

  @Public()
  @All('*path')
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
      const nodeHandler = toNodeHandler(auth.handler);

      this.logger.log(`Auth request: ${req.method} ${req.url}`);

      await nodeHandler(req, res);

      if (res.statusCode >= 400) {
        this.logger.warn(
          `Auth request failed: ${req.method} ${req.url} -> Status ${res.statusCode}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Auth handler exception: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    }
  }

  private hasGoogleOAuth(): boolean {
    return Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    );
  }
}
