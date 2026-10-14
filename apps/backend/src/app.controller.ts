import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('version')
  version() {
    return {
      version: process.env.APP_VERSION ?? 'development',
      commit: process.env.APP_COMMIT ?? 'unknown',
      environment: process.env.APP_ENV ?? 'development',
    };
  }

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
