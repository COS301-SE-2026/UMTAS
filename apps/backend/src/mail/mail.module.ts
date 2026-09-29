import { Module } from '@nestjs/common';
import { MailerModule, type MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';
import { MailerService } from './mailer.service';
import type { TransportOptions } from 'nodemailer';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST ?? 'localhost',
        port: Number(process.env.SMTP_PORT ?? 1025),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
      } as TransportOptions,
      // nodemailer 10 moved its typings under dist/, so the mailer's `Options`
      // union no longer exposes message fields such as `from`.
      defaults: {
        from: process.env.SMTP_FROM ?? 'noreply@umtas.co.za',
      } as MailerOptions['defaults'],
      template: {
        dir: join(process.cwd(), 'src/mail/templates'),
        adapter: new HandlebarsAdapter(),
        options: { strict: true },
      },
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailModule {}
