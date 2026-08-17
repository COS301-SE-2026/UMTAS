import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString, IsUUID } from 'class-validator';

export const AUTH_ERROR_CODES = [
  'ACCOUNT_ALREADY_LINKED',
  'EMAIL_ALREADY_IN_USE',
  'EMAIL_ALREADY_VERIFIED',
  'EMAIL_NOT_VERIFIED',
  'INSUFFICIENT_PERMISSIONS',
  'INVALID_CODE',
  'INVALID_EMAIL',
  'INVALID_EMAIL_OR_PASSWORD',
  'INVALID_PASSWORD',
  'INVALID_TOKEN',
  'SESSION_NOT_FOUND',
  'UNAUTHORIZED',
  'USER_EMAIL_ALREADY_EXISTS',
  'USER_NOT_FOUND',
  'RATE_LIMITED',
  'INTERNAL_SERVER_ERROR',
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export class AuthUserDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String })
  email!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: Boolean })
  emailVerified!: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  image?: string | null;

  @ApiProperty({ enum: ['user', 'sys_admin'] })
  role!: 'user' | 'sys_admin';

  @ApiProperty({ type: Boolean })
  banned!: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  banReason?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  banExpires?: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class AuthSessionDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  token!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  userId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  ipAddress?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  userAgent?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  impersonatedBy?: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class AuthEnvelopeDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({ type: AuthSessionDto })
  session!: AuthSessionDto;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  uniId?: string;

  @ApiPropertyOptional({
    enum: [
      'student',
      'uni_admin',
      'lecturer',
      'uni_admin_pending',
      'lecturer_pending',
    ],
  })
  uniRole?:
    | 'student'
    | 'uni_admin'
    | 'lecturer'
    | 'uni_admin_pending'
    | 'lecturer_pending';
}

export class AuthUserResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}

export class AuthAcknowledgementDto {}

export class AuthErrorDto {
  @ApiProperty({ enum: AUTH_ERROR_CODES })
  error!: AuthErrorCode;

  @ApiPropertyOptional({ type: String })
  message?: string;
}

export class SignUpEmailDto {
  @ApiProperty({
    type: String,
    description: 'Valid email address',
    example: 'system-admin@local.umtas',
    default: 'system-admin@local.umtas',
    required: true,
  })
  email!: string;

  @ApiProperty({
    type: String,
    description: 'Minimum 8, maximum 128 characters',
    example: 'Admin@UMTAS2024!',
    default: 'Admin@UMTAS2024!',
    minLength: 8,
    maxLength: 128,
    required: true,
  })
  password!: string;

  @ApiProperty({
    type: String,
    description: 'Full name of the user',
    example: 'System Admin',
    default: 'System Admin',
    required: true,
  })
  name!: string;
}

export class SignInEmailDto {
  @ApiProperty({
    example: 'system-admin@local.umtas',
    default: 'system-admin@local.umtas',
  })
  email!: string;

  @ApiProperty({ example: 'Admin@UMTAS2024!', default: 'Admin@UMTAS2024!' })
  password!: string;
}

export class RevokeSessionDto {
  @ApiProperty({
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    default: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    description: 'ID of the session to terminate',
  })
  sessionId!: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    example: 'abc123def456',
    default: 'abc123def456',
    description: 'Verification code from the email link',
  })
  code!: string;

  @ApiProperty({
    example: 'system-admin@local.umtas',
    default: 'system-admin@local.umtas',
  })
  email!: string;
}

export class ForgetPasswordDto {
  @ApiProperty({
    example: 'system-admin@local.umtas',
    default: 'system-admin@local.umtas',
  })
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'reset-token-from-email-link',
    default: 'reset-token-from-email-link',
    description: 'Token from the password reset email',
  })
  token!: string;

  @ApiProperty({
    example: 'new-secure-password',
    default: 'new-secure-password',
    minLength: 8,
    maxLength: 128,
  })
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    example: 'current-password',
    default: 'current-password',
  })
  currentPassword!: string;

  @ApiProperty({
    example: 'new-secure-password',
    default: 'new-secure-password',
    minLength: 8,
    maxLength: 128,
  })
  newPassword!: string;
}

export class LinkGoogleAccountDto {
  @ApiProperty({
    example: '4/0AX4XfWj...',
    default: '4/0AX4XfWj...',
    description: 'Authorization code from the Google OAuth flow',
  })
  code!: string;

  @ApiProperty({
    example: 'state-string',
    default: 'state-string',
    description: 'OAuth state parameter',
  })
  state!: string;
}

export class AdminCreateUserDto {
  @ApiProperty({
    example: 'system-admin@local.umtas',
    default: 'system-admin@local.umtas',
  })
  email!: string;

  @ApiProperty({
    example: 'Admin@UMTAS2024!',
    default: 'Admin@UMTAS2024!',
    minLength: 8,
    maxLength: 128,
  })
  password!: string;

  @ApiProperty({ example: 'System Admin', default: 'System Admin' })
  name?: string;

  @ApiProperty({
    enum: ['user', 'sys_admin'],
    example: 'user',
    default: 'user',
  })
  role?: 'user' | 'sys_admin';
}

export class AdminBanUserDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    default: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID of the user to ban',
  })
  userId!: string;

  @ApiProperty({
    example: 'Violation of terms of service',
    default: 'Violation of terms of service',
  })
  reason!: string;

  @ApiPropertyOptional({
    example: '2026-02-01T00:00:00Z',
    description: 'Ban expiry datetime. Omit or set null for a permanent ban.',
    nullable: true,
  })
  banExpiresAt?: string | null;
}

export class AdminUpdateUserDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    default: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID of the user to update',
  })
  userId!: string;

  @ApiPropertyOptional({ example: 'New Name' })
  name?: string;

  @ApiPropertyOptional({ example: 'newemail@example.com' })
  email?: string;

  @ApiPropertyOptional({
    enum: ['user', 'sys_admin'],
    example: 'user',
  })
  role?: 'user' | 'sys_admin';
}

export class AdminImpersonateUserDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    default: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID of the user to impersonate',
  })
  userId!: string;
}

export class SelectUniversityDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'University ID selected by the user',
  })
  @IsUUID()
  uniId!: string;
}

export enum MockUserRole {
  STUDENT = 'STUDENT',
  LECTURER = 'LECTURER',
  UNIVERSITY_ADMIN = 'UNIVERSITY_ADMIN',
  SYS_ADMIN = 'SYS_ADMIN',
}

export class CreateMockUserDto {
  @ApiProperty({
    enum: MockUserRole,
    enumName: 'MockUserRole',
    description: 'Role for the mock user',
    default: MockUserRole.STUDENT,
  })
  role!: MockUserRole;
}

export class CreateMockUserResponseDto extends SignInEmailDto {}

export class DeleteMockUsersResponseDto {
  @IsBoolean()
  success!: boolean;

  @IsString()
  message!: string;
}
