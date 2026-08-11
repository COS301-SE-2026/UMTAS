import { Module } from '@nestjs/common';
import { ApiService } from './ApiService.service';
import { UniversityModule } from 'src/University/university.module';

@Module({
  imports: [UniversityModule],
  controllers: [],
  providers: [ApiService],
  exports: [ApiService],
})
export class ApiServiceModule {}
