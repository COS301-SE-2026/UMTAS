import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import stableStringify from 'fast-json-stable-stringify';
import type { SolverEngine, SolverInput } from 'shared-types';

export const SOLVER_DEDUPLICATION_KEY_VERSION = 'solver-semantic-sha256-v1';

@Injectable()
export class SolverFingerprintService {
  compute(input: {
    solverProfileKey: string;
    solveMode: 'feasibility' | 'optimization';
    engine: SolverEngine;
    solverInput: SolverInput;
  }): string {
    const semanticInput = {
      solverProfileKey: input.solverProfileKey,
      solveMode: input.solveMode,
      engine: input.engine,
      schedulingProblem: {
        events: input.solverInput.schedulingProblem.events
          .map((event) => {
            const canonicalEvent = structuredClone(event);
            canonicalEvent.venues.sort((first, second) =>
              first.id.localeCompare(second.id),
            );
            return canonicalEvent;
          })
          .sort((a, b) => a.eventId.localeCompare(b.eventId)),
      },
      preferences: {
        heuristics: input.solverInput.preferences.heuristics
          .map((heuristic) => structuredClone(heuristic))
          .sort((first, second) =>
            stableStringify(first).localeCompare(stableStringify(second)),
          ),
      },
    };
    const hash = createHash('sha256')
      .update(stableStringify(semanticInput))
      .digest('hex');

    return `${SOLVER_DEDUPLICATION_KEY_VERSION}:${hash}`;
  }
}
