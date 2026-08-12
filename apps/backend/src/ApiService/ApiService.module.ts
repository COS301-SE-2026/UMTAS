import { Module } from '@nestjs/common';
import { ApiService } from './ApiService.service';
import { UniversityModule } from 'src/University/university.module';
import { ApiServiceController } from './ApiService.controller';
import { CourseModule } from 'src/Course/course.module';
import { AdapterRegistry } from './Registry/AdapterRegistry';

@Module({
  imports: [UniversityModule, CourseModule],
  controllers: [ApiServiceController],
  providers: [ApiService, AdapterRegistry],
  exports: [ApiService],
})
export class ApiServiceModule {}
