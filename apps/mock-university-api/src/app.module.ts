import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CourseModule } from './course/course.module';
import { ModuleModule } from './module/module.module';
import { EventModule } from './event/event.module';

@Module({
  imports: [CourseModule, EventModule, ModuleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
