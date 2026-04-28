import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './db/database.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { RolesGuard } from './auth/roles.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '../../.env.local'],
    }),
    DatabaseModule,
    HealthModule,
  ],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    AuthService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
