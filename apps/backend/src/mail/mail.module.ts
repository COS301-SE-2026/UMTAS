import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { MailerService } from './mailer.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST || 'localhost',
        port: Number(process.env.SMTP_PORT ?? 1025),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      },
      defaults: {
        from: process.env.SMTP_FROM ?? 'noreply@umtas.co.za',
      },
      // Template configuration - will be set up dynamically in service
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailModule {}
