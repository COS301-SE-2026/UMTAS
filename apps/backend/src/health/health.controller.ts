import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
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

  @Get('live')
  liveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    const result = await this.healthService.check(false);
    if (result.services.database !== 'ok' || result.services.redis !== 'ok') {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }

  @Get('check')
  check() {
    return this.healthService.check();
  }
}
