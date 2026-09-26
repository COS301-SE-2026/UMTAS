import { Module } from '@nestjs/common';
import { ModuleModule } from 'src/Module/module.module';

@Module({
  imports: [ModuleModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class VisionModule {}
