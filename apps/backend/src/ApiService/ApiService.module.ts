import { Module } from '@nestjs/common';
import { ApiService } from './ApiService.service';
import { UniversityModule } from 'src/University/university.module';
import { ApiServiceController } from './ApiService.controller';
import { CourseModule } from 'src/Course/course.module';
import { AdapterRegistry } from './Registry/AdapterRegistry.service';
import { ModuleModule } from 'src/Module/module.module';
import { EventModule } from 'src/Events/event.module';

@Module({
  imports: [UniversityModule, CourseModule, ModuleModule, EventModule],
  controllers: [ApiServiceController],
  providers: [ApiService, AdapterRegistry],
  exports: [ApiService],
})
export class ApiServiceModule {}
