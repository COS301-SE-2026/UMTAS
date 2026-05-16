import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

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
      // NestMailerService doesn't expose the transporter verify directly easily,
      // but we can try to send a test if needed, or check if transporter exists.
      // @nestjs-modules/mailer uses nodemailer under the hood.
      const transporter = (this.mailerService as any).messenger?.transporter;
      if (transporter && typeof transporter.verify === 'function') {
        await transporter.verify();
      }
    } catch (error) {
      this.logger.error('Mailer verification failed', error);
      throw error;
    }
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      const mailOptions: any = {
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
        `Email sent to ${options.to} (${options.template || 'text'})`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw error;
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
  }): Promise<void> {
    await this.sendTemplateMail({
      to: input.email,
      subject: 'Reset your UMTAS password',
      template: 'reset-password',
      context: {
        name: input.name,
        resetUrl: input.url,
        expiresInHours: 1,
      },
    });
  }
}
