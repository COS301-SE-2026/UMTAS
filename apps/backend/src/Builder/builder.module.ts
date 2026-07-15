import { Module } from '@nestjs/common';
import { BuilderController } from './builder.controller';
import { BuilderService } from './builder.service';
import { UniversityModule } from 'src/University/university.module';
import { CourseModule } from 'src/Course/course.module';
import { ModuleModule } from 'src/Module/module.module';

@Module({
  imports: [UniversityModule, CourseModule, ModuleModule],
  controllers: [BuilderController],
  providers: [BuilderService],
  exports: [BuilderService],
})
export class BuilderModule {}
