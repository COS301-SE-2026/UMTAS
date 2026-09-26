import { Module } from '@nestjs/common';
import { ModuleModule } from 'src/Module/module.module';
import { VisionService } from './vision.service';
import { VisionController } from './vision.controller';

@Module({
  imports: [ModuleModule],
  controllers: [VisionController],
  providers: [VisionService],
  exports: [VisionService],
})
export class VisionModule {}
