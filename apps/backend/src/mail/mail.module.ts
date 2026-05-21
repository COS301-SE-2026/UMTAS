import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';
import { MailerService } from './mailer.service';
import type { TransportOptions } from 'nodemailer';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mailService = configService.get<string>('MAIL_SERVICE');
        const mailUser = configService.get<string>('MAIL_USER');
        const mailPass = configService.get<string>('MAIL_PASS');
        const mailHost = configService.get<string>('MAIL_HOST') || 'localhost';
        const mailPort = configService.get<number>('MAIL_PORT') || 1025;
        const mailSecure = configService.get<string>('MAIL_SECURE') === 'true';
        const mailFrom =
          configService.get<string>('MAIL_FROM') || 'noreply@umtas.co.za';

        let transport: unknown;
        if (mailService) {
          transport = {
            service: mailService,
            auth:
              mailUser && mailPass
                ? { user: mailUser, pass: mailPass }
                : undefined,
            requireTLS: true,
          };
        } else {
          transport = {
            host: mailHost,
            port: mailPort,
            secure: mailSecure,
            auth:
              mailUser && mailPass
                ? { user: mailUser, pass: mailPass }
                : undefined,
          };
        }

        return {
          transport: transport as TransportOptions,
          defaults: {
            from: mailFrom,
          },
          template: {
            dir: join(process.cwd(), 'src/mail/templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailModule {}
