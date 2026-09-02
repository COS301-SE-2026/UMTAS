import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { EventCriteria } from './dto/event.types';

export interface EventImportFingerprintInput {
  activityType?: string | null;
  activityCode: string | null | undefined;
  eventCriteria: EventCriteria;
  venueNames?: readonly string[];
  eventName?: string;
}

export interface ModuleEventImportFingerprintInput extends EventImportFingerprintInput {
  moduleId: string;
}

/** Internal deterministic de-duplication value. Never expose it as event identity. */
@Injectable()
export class EventImportFingerprintService {
  buildForEvent(input: EventImportFingerprintInput): string | null {
    const moduleId = input.eventCriteria.moduleId;
    return moduleId ? this.buildForModuleEvent({ ...input, moduleId }) : null;
  }

  buildForModuleEvent(input: ModuleEventImportFingerprintInput): string {
    const venues = [
      ...new Set(
        (input.venueNames ?? [])
          .map((name) => name.trim().toLocaleLowerCase())
          .map((name) => name.slice(0, 30))
          .filter(Boolean),
      ),
    ].sort();
    return this.hash([
      input.moduleId,
      input.activityType ?? '',
      input.activityCode ?? '',
      input.eventCriteria.date ?? '',
      input.eventCriteria.dayOfWeek ?? '',
      input.eventCriteria.startTime,
      input.eventCriteria.endTime,
      input.eventName ?? '',
      ...venues,
    ]);
  }

  private hash(parts: readonly string[]): string {
    const hash = createHash('sha256');
    for (const part of parts) {
      hash.update(`${part.length}:`);
      hash.update(part);
    }
    return hash.digest('base64url');
  }
}
