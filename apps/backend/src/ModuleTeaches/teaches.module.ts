import { Module } from '@nestjs/common';
import { TeachesService } from './teaches.service';
import { ModuleModule } from 'src/Module/module.module';

@Module({
  imports: [ModuleModule],
  controllers: [],
  providers: [TeachesService],
  exports: [TeachesService],
})
export class TeachesModule {}
