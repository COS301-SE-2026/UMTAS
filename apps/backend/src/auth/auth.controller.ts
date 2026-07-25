import {
  All,
  Body,
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
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
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
  AuthAcknowledgementDto,
  AuthEnvelopeDto,
  AuthErrorDto,
  AuthSessionDto,
  AuthUserResponseDto,
  ChangePasswordDto,
  ForgetPasswordDto,
  LinkGoogleAccountDto,
  ResetPasswordDto,
  RevokeSessionDto,
  SelectUniversityDto,
  SignInEmailDto,
  SignUpEmailDto,
  VerifyEmailDto,
} from './auth.dto';
import { CurrentSession } from './session.decorator';
import type { SessionData } from './session.decorator';
import type { Response } from 'express';

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
@ApiExtraModels(AuthEnvelopeDto)
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
    type: AuthEnvelopeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email format or password too weak (min 8 characters)',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Email already registered',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limited - max 100 requests per 60 seconds',
    type: AuthErrorDto,
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
    type: AuthEnvelopeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Email not verified - must verify before signing in',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
    type: AuthErrorDto,
  })
  @ApiResponse({ status: 429, description: 'Rate limited', type: AuthErrorDto })
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
    type: AuthAcknowledgementDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No active session',
    type: AuthErrorDto,
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
  @Get('get-session')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Get the current user session',
    operationId: 'getSession',
  })
  @ApiResponse({
    status: 200,
    description: 'Active session returned, or null if no session exists.',
    schema: {
      allOf: [{ $ref: getSchemaPath(AuthEnvelopeDto) }],
      nullable: true,
      example: AUTH_RESPONSE_EXAMPLE,
    },
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
    type: [AuthSessionDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthErrorDto,
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
    type: AuthAcknowledgementDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Session not found',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthErrorDto,
  })
  async revokeSession(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  // ─── Email verification ───────────────────────────────────────────────────────
  @Public()
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
    type: AuthAcknowledgementDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Email already verified',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthErrorDto,
  })
  @ApiResponse({ status: 429, description: 'Rate limited', type: AuthErrorDto })
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
    type: AuthEnvelopeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification code, or email not found',
    type: AuthErrorDto,
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
    type: AuthAcknowledgementDto,
  })
  @ApiResponse({ status: 429, description: 'Rate limited', type: AuthErrorDto })
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
    type: AuthEnvelopeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token, or new password too weak',
    type: AuthErrorDto,
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
    type: AuthAcknowledgementDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Incorrect current password or new password too weak',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthErrorDto,
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
    type: String,
    required: true,
    description: 'Authorization code issued by Google',
    example: '4/0AX4XfWj...',
  })
  @ApiQuery({
    name: 'state',
    type: String,
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
    type: AuthErrorDto,
  })
  async googleOAuthCallback(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    if (!this.hasGoogleOAuth()) {
      throw new NotFoundException('Google OAuth is not configured');
    }
    this.logger.log(
      `Callback cookies: ${JSON.stringify(req.headers.cookie ?? 'NONE')}`,
    );
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
    type: AuthEnvelopeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Account already linked or invalid OAuth code',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 422,
    description:
      'The Google account email is already in use by another account',
    type: AuthErrorDto,
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
    type: AuthUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (sys_admin required)',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Email already registered',
    type: AuthErrorDto,
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
    type: AuthEnvelopeDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (sys_admin required)',
    type: AuthErrorDto,
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
    type: AuthUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (sys_admin required)',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: AuthErrorDto,
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
    type: AuthUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (sys_admin required)',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 422,
    description: 'New email already in use',
    type: AuthErrorDto,
  })
  async adminUpdateUser(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse,
  ): Promise<void> {
    return this.handleRequest(req, res);
  }

  //Select a university
  @Post('select-university')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({ summary: 'Select current university' })
  @ApiResponse({
    status: 200,
    description: 'Selected university session returned.',
    type: AuthEnvelopeDto,
  })
  async selectUniversity(
    @CurrentSession() session: SessionData,
    @Body() dto: SelectUniversityDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionData> {
    const selected = this.authService.selectUniversity(session, dto.uniId);

    res.cookie('umtas-uni-id', dto.uniId, {
      path: '/',
      sameSite: 'lax',
    });

    return selected;
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

      this.logger.log(`━━━ Auth request: ${req.method} ${req.url}`);

      this.logger.log(`  Host: ${req.headers.host ?? 'none'}`);
      this.logger.log(`  Origin: ${req.headers.origin ?? 'none'}`);
      this.logger.log(`  Referer: ${req.headers.referer ?? 'none'}`);

      const incomingCookie = req.headers.cookie;
      if (incomingCookie) {
        const cookieNames = incomingCookie
          .split(';')
          .map((c) => c.trim().split('=')[0])
          .join(', ');
        this.logger.log(`  Incoming cookie names: ${cookieNames}`);
      } else {
        this.logger.log(`  Incoming cookies: NONE`);
      }

      const originalSetHeader = res.setHeader.bind(res);
      res.setHeader = (
        name: string,
        value: string | number | readonly string[],
      ) => {
        if (name.toLowerCase() === 'set-cookie') {
          const cookies = Array.isArray(value) ? value : [String(value)];
          for (const c of cookies) {
            const [nameValue, ...attrs] = c.split(';');
            const cookieName = nameValue.split('=')[0];
            this.logger.log(
              `  Set-Cookie: ${cookieName}; ${attrs.map((a) => a.trim()).join('; ')}`,
            );
          }
        }
        return originalSetHeader(name, value);
      };

      const isGetSession = req.url?.includes('/get-session');
      let capturedBody = '';
      if (isGetSession) {
        const originalWrite = res.write.bind(res);
        const originalEnd = res.end.bind(res);
        const appendChunk = (chunk: unknown) => {
          if (Buffer.isBuffer(chunk)) {
            capturedBody += chunk.toString('utf8');
          } else if (typeof chunk === 'string') {
            capturedBody += chunk;
          }
        };
        res.write = ((chunk: unknown, ...args: unknown[]) => {
          appendChunk(chunk);
          return (originalWrite as (...a: unknown[]) => boolean)(
            chunk,
            ...args,
          );
        }) as typeof res.write;
        res.end = ((chunk: unknown, ...args: unknown[]) => {
          appendChunk(chunk);
          return (originalEnd as (...a: unknown[]) => ServerResponse)(
            chunk,
            ...args,
          );
        }) as typeof res.end;
      }

      await nodeHandler(req, res);

      if (isGetSession) {
        this.logger.log(
          `  get-session BODY: ${capturedBody.length ? capturedBody.slice(0, 300) : 'EMPTY'}`,
        );
      }

      const location = res.getHeader('location');
      this.logger.log(
        `  Response status: ${res.statusCode}${location ? ` -> redirect to ${String(location)}` : ''}`,
      );
      this.logger.log(
        `  CORS allow-origin: ${String(res.getHeader('access-control-allow-origin') ?? 'none')}`,
      );
      this.logger.log(
        `  CORS allow-credentials: ${String(res.getHeader('access-control-allow-credentials') ?? 'none')}`,
      );

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
