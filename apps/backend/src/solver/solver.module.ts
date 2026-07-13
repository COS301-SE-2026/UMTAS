import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { SolverController } from './solver.controller';
import { SolverInputBuilderService } from './solver-input-builder.service';
import { SolverJobStoreService } from './solver-job-store.service';

@Module({
  imports: [JobsModule],
  controllers: [SolverController],
  providers: [SolverJobStoreService, SolverInputBuilderService],
})
export class SolverModule {}
