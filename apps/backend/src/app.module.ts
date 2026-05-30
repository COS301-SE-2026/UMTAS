import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { ModuleModule } from './Module/module.module';
import { EventModule } from './Events/event.module';
import { TimetableModule } from './Timetable/timetable.module';
import { RedisQueueModule } from './redis/redis-queue.module';
import { PdfParserModule } from './pdf-parser/pdf-parser.module';
import { SolverModule } from './solver/solver.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '../../.env', '../../.env.local'],
    }),
    DatabaseModule,
    HealthModule,
    MailModule,
    ModuleModule,
    EventModule,
    TimetableModule,
    RedisQueueModule,
    PdfParserModule,
    SolverModule,
  ],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
