import { Module } from '@nestjs/common';
import { TeachesService } from './teaches.service';
import { ModuleModule } from 'src/Module/module.module';
import { TeachesController } from './teaches.controller';

@Module({
  imports: [ModuleModule],
  controllers: [TeachesController],
  providers: [TeachesService],
  exports: [TeachesService],
})
export class TeachesModule {}
