import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import type { ISendMailOptions } from '@nestjs-modules/mailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, unknown>;
  text?: string;
  html?: string;
}

export interface TemplateMailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly mailerService: NestMailerService) {}

  async verify(): Promise<void> {
    try {
      // @nestjs-modules/mailer wraps nodemailer. We access the underlying transporter
      // directly since no public verify() API is exposed. May need updating on
      // major version bumps of @nestjs-modules/mailer.
      const service = this.mailerService as unknown as {
        transporter?: { verify?: () => Promise<unknown> };
      };
      if (typeof service.transporter?.verify === 'function') {
        await service.transporter.verify();
        this.logger.log('Mailer verification succeeded');
      }
    } catch (error) {
      this.logger.warn('Mailer verification failed (SMTP unavailable)', error);
      // Don't throw: email is optional and SMTP may not be configured.
      // The application should continue to operate.
    }
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const emailType = options.template || 'text';
    this.logger.log(
      `[MAIL] Attempting to send email to ${options.to} (${emailType}): "${options.subject}"`,
    );

    try {
      const mailOptions: ISendMailOptions = {
        to: options.to,
        subject: options.subject,
      };

      if (options.template) {
        mailOptions.template = options.template;
        mailOptions.context = options.context || {};
      } else if (options.html) {
        mailOptions.html = options.html;
      } else {
        // Fallback to text
        mailOptions.text = options.text || options.subject;
      }

      await this.mailerService.sendMail(mailOptions);
      this.logger.log(
        `[MAIL] ✓ Successfully sent email to ${options.to} (${emailType})`,
      );
    } catch (error) {
      this.logger.error(
        `[MAIL] ✗ Failed to send email to ${options.to} (${emailType}): ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : error,
      );
      // Don't throw: email is optional in dev. Background tasks should not fail due to email.
    }
  }

  async sendTemplateMail(options: TemplateMailOptions): Promise<void> {
    await this.sendMail({
      to: options.to,
      subject: options.subject,
      template: options.template,
      context: options.context,
    });
  }

  async sendVerificationEmail(input: {
    email: string;
    name: string;
    url: string;
  }): Promise<void> {
    this.logger.log(
      `[MAIL] Sending verification email for user: ${input.name} (${input.email})`,
    );
    await this.sendTemplateMail({
      to: input.email,
      subject: 'Verify your UMTAS account',
      template: 'verify-email',
      context: {
        name: input.name,
        verifyUrl: input.url,
      },
    });
  }

  async sendResetPasswordEmail(input: {
    email: string;
    name: string;
    url: string;
    expiresInHours?: number;
  }): Promise<void> {
    // Default token expiry (1 hour) - sync with BetterAuth's email verification token TTL
    const expiresInHours = input.expiresInHours ?? 1;

    this.logger.log(
      `[MAIL] Sending password reset email for user: ${input.name} (${input.email}), expires in ${expiresInHours}h`,
    );
    await this.sendTemplateMail({
      to: input.email,
      subject: 'Reset your UMTAS password',
      template: 'reset-password',
      context: {
        name: input.name,
        resetUrl: input.url,
        expiresInHours,
      },
    });
  }
}
