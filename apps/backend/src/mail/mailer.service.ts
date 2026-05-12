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

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly mailerService: NestMailerService) {}

  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      // Support both template-based and plain text emails
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
        mailOptions.text = options.text || `Email from UMTAS`;
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
}
