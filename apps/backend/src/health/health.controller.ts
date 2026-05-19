import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '../auth/auth.guard';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  live() {
    return { status: 'ok' };
  }

  @Get('check')
  check() {
    return this.healthService.check();
  }
}
