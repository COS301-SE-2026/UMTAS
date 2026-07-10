import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { EventCriteria } from './dto/event.types';

export interface EventImportKeyInput {
  eventName: string;
  eventCode: string | null | undefined;
  eventCriteria: EventCriteria;
}

export interface ModuleEventImportKeyInput {
  moduleId: string;
  eventName: string;
  eventCode: string | null | undefined;
  eventCriteria: EventCriteria;
}

@Injectable()
export class EventImportKeyService {
  buildForEvent(input: EventImportKeyInput): string | null {
    const moduleId = input.eventCriteria.moduleID;

    if (!moduleId) {
      return null;
    }

    const moduleInput: ModuleEventImportKeyInput = {
      moduleId: moduleId,
      eventName: input.eventName,
      eventCode: input.eventCode,
      eventCriteria: input.eventCriteria,
    };

    return this.buildForModuleEvent(moduleInput);
  }

  buildForModuleEvent(input: ModuleEventImportKeyInput): string {
    const eventCode = input.eventCode ?? '';
    const venue = input.eventCriteria.venue ?? '';

    return this.hashImportKey([
      input.moduleId,
      input.eventName,
      eventCode,
      input.eventCriteria.date,
      input.eventCriteria.startTime,
      input.eventCriteria.endTime,
      venue,
    ]);
  }

  private hashImportKey(parts: readonly string[]): string {
    const hash = createHash('sha256');

    for (const part of parts) {
      hash.update(this.encodeLength(part.length));
      hash.update(part);
    }

    return hash.digest('base64url');
  }

  private encodeLength(length: number): string {
    return `${length}:`;
  }
}
