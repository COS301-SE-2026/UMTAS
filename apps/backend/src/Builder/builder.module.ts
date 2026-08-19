import { Module } from '@nestjs/common';
import { BuilderController } from './builder.controller';
import { BuilderService } from './builder.service';
import { UniversityModule } from 'src/University/university.module';
import { CourseModule } from 'src/Course/course.module';
import { ModuleModule } from 'src/Module/module.module';
import { BuilderServiceV2 } from './builderV2.service';
import { EventModule } from 'src/Events/event.module';

@Module({
  imports: [UniversityModule, CourseModule, ModuleModule, EventModule],
  controllers: [BuilderController],
  providers: [BuilderService, BuilderServiceV2],
  exports: [BuilderService, BuilderServiceV2],
})
export class BuilderModule {}
