import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignUpEmailDto {
  @ApiProperty({
    type: String,
    description: 'Valid email address',
    example: 'system-admin@local.umtas',
    default: 'system-admin@local.umtas',
    required: true,
  })
  email: string;

  @ApiProperty({
    type: String,
    description: 'Minimum 8, maximum 128 characters',
    example: 'Admin@UMTAS2024!',
    default: 'Admin@UMTAS2024!',
    minLength: 8,
    maxLength: 128,
    required: true,
  })
  password: string;

  @ApiProperty({
    type: String,
    description: 'Full name of the user',
    example: 'System Admin',
    default: 'System Admin',
    required: true,
  })
  name: string;
}

export class SignInEmailDto {
  @ApiProperty({
    example: 'system-admin@local.umtas',
    default: 'system-admin@local.umtas',
  })
  email: string;

  @ApiProperty({ example: 'Admin@UMTAS2024!', default: 'Admin@UMTAS2024!' })
  password: string;
}

export class RevokeSessionDto {
  @ApiProperty({
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    default: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    description: 'ID of the session to terminate',
  })
  sessionId: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    example: 'abc123def456',
    default: 'abc123def456',
    description: 'Verification code from the email link',
  })
  code: string;

  @ApiProperty({
    example: 'system-admin@local.umtas',
    default: 'system-admin@local.umtas',
  })
  email: string;
}

export class ForgetPasswordDto {
  @ApiProperty({
    example: 'system-admin@local.umtas',
    default: 'system-admin@local.umtas',
  })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'reset-token-from-email-link',
    default: 'reset-token-from-email-link',
    description: 'Token from the password reset email',
  })
  token: string;

  @ApiProperty({
    example: 'new-secure-password',
    default: 'new-secure-password',
    minLength: 8,
    maxLength: 128,
  })
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    example: 'current-password',
    default: 'current-password',
  })
  currentPassword: string;

  @ApiProperty({
    example: 'new-secure-password',
    default: 'new-secure-password',
    minLength: 8,
    maxLength: 128,
  })
  newPassword: string;
}

export class LinkGoogleAccountDto {
  @ApiProperty({
    example: '4/0AX4XfWj...',
    default: '4/0AX4XfWj...',
    description: 'Authorization code from the Google OAuth flow',
  })
  code: string;

  @ApiProperty({
    example: 'state-string',
    default: 'state-string',
    description: 'OAuth state parameter',
  })
  state: string;
}

export class AdminCreateUserDto {
  @ApiProperty({
    example: 'system-admin@local.umtas',
    default: 'system-admin@local.umtas',
  })
  email: string;

  @ApiProperty({
    example: 'Admin@UMTAS2024!',
    default: 'Admin@UMTAS2024!',
    minLength: 8,
    maxLength: 128,
  })
  password: string;

  @ApiProperty({ example: 'System Admin', default: 'System Admin' })
  name: string;

  @ApiProperty({
    enum: ['student', 'uni_admin', 'sys_admin'],
    example: 'student',
    default: 'student',
  })
  role: 'student' | 'uni_admin' | 'sys_admin';
}

export class AdminBanUserDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    default: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID of the user to ban',
  })
  userId: string;

  @ApiProperty({
    example: 'Violation of terms of service',
    default: 'Violation of terms of service',
  })
  reason: string;

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
  userId: string;

  @ApiPropertyOptional({ example: 'New Name' })
  name?: string;

  @ApiPropertyOptional({ example: 'newemail@example.com' })
  email?: string;

  @ApiPropertyOptional({
    enum: ['student', 'uni_admin', 'sys_admin'],
    example: 'student',
  })
  role?: 'student' | 'uni_admin' | 'sys_admin';
}
