import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { SolverEngine, SolverPreferences } from 'shared-types';
import { QueueProducerService } from '../jobs/queue-producer.service';
import { SolverFingerprintService } from './solver-fingerprint.service';
import { SolverInputBuilderService } from './solver-input-builder.service';
import {
  SolverJobStoreService,
  type SolverJobRecord,
} from './solver-job-store.service';

export interface SolverSubmissionInput {
  userId: string;
  solverProfileKey: string;
  solveMode: 'feasibility' | 'optimization';
  engine: SolverEngine;
  preferences: SolverPreferences;
}

@Injectable()
export class SolverSubmissionService {
  constructor(
    private readonly jobStore: SolverJobStoreService,
    private readonly queueProducer: QueueProducerService,
    private readonly inputBuilder: SolverInputBuilderService,
    private readonly fingerprintService: SolverFingerprintService,
  ) {}

  async submit(input: SolverSubmissionInput): Promise<SolverJobRecord> {
    const solverInput = await this.inputBuilder.buildForProfile(
      input.solverProfileKey,
      input.preferences,
    );
    const deduplicationKey = this.fingerprintService.compute({
      solverProfileKey: input.solverProfileKey,
      solveMode: input.solveMode,
      engine: input.engine,
      solverInput,
    });
    const reservation = await this.jobStore.reserveOrReuse({
      userId: input.userId,
      solverProfileKey: input.solverProfileKey,
      solveMode: input.solveMode,
      requestedEngine: input.engine,
      deduplicationKey,
      solverInput,
    });
    if (reservation.kind === 'reused') return reservation.record;

    try {
      await this.queueProducer.enqueueTimetableSolveJob({
        jobId: reservation.record.jobId,
        attemptToken: reservation.record.attemptToken,
        solveMode: reservation.record.solveMode,
        engine: reservation.record.requestedEngine ?? 'auto',
      });
    } catch {
      throw new InternalServerErrorException(
        'Solver job could not be enqueued',
      );
    }
    await this.jobStore.markEnqueued(
      reservation.record.jobId,
      reservation.record.attemptToken,
    );
    return reservation.record;
  }
}
