import { Controller, Post } from '@nestjs/common';
import { HealthService } from './health.service';
import { Roles } from '../auth/roles.guard';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Post('hello')
  @Roles('student')
  async hello() {
    const entity = await this.healthService.writeHello();

    return {
      success: true,
      message: entity.message,
      id: entity.id,
      createdAt: entity.createdAt,
    };
  }
}
