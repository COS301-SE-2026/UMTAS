import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { SolverController } from './solver.controller';

@Module({
  imports: [JobsModule],
  controllers: [SolverController],
})
export class SolverModule {}
