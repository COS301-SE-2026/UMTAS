import { Module } from '@nestjs/common';
import { ApiService } from './ApiService.service';
import { UniversityModule } from 'src/University/university.module';
import { ApiServiceController } from './ApiService.controller';

@Module({
  imports: [UniversityModule],
  controllers: [ApiServiceController],
  providers: [ApiService],
  exports: [ApiService],
})
export class ApiServiceModule {}
