import { ConflictException, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { ParsedModuleCandidate, PdfParserResult } from 'shared-types';
import type { AppDatabase } from '../db/database.service';
import { GroupModules, ModuleGrouping, type ParseJob } from '../entities';
import { EventImporter } from './event-importer.service';
import { ModuleResolver } from './module-resolver.service';
import { hashModuleIds, normalizeModuleCode } from './pdf-parser-import.utils';

@Injectable()
export class ParserResultImporter {
  constructor(
    private readonly moduleResolver: ModuleResolver,
    private readonly eventImporter: EventImporter,
  ) {}

  async importResult(
    db: AppDatabase,
    job: ParseJob,
    result: PdfParserResult,
  ): Promise<string> {
    const candidateByCode = this.collectModuleCandidates(result);
    const moduleByCode = await this.moduleResolver.resolveForUniversity(
      db,
      job.UniversityID,
      candidateByCode,
    );
    const moduleGroupingId = await this.createOrReuseModuleGrouping(
      db,
      Array.from(moduleByCode.values()).map((module) => module.moduleID),
    );

    await this.eventImporter.createMissingEvents(
      db,
      job.UniversityID,
      result.events,
      moduleByCode,
    );

    return moduleGroupingId;
  }

  private collectModuleCandidates(
    result: PdfParserResult,
  ): Map<string, ParsedModuleCandidate> {
    const candidates = new Map<string, ParsedModuleCandidate>();

    for (const candidate of result.modules) {
      const code = normalizeModuleCode(candidate.code);
      if (!code || candidates.has(code)) {
        continue;
      }

      candidates.set(code, candidate);
    }

    for (const event of result.events) {
      const code = normalizeModuleCode(event.moduleCode);
      if (!code || candidates.has(code)) {
        continue;
      }

      candidates.set(code, {
        code,
        name: code,
        metadata: {},
        warnings: [],
      });
    }

    return candidates;
  }

  private async createOrReuseModuleGrouping(
    db: AppDatabase,
    moduleIds: string[],
  ): Promise<string> {
    const sortedModuleIds = [...new Set(moduleIds)].sort();
    const hash =
      sortedModuleIds.length > 0 ? hashModuleIds(sortedModuleIds) : null;

    if (hash) {
      const [existingGroup] = await db
        .select()
        .from(ModuleGrouping)
        .where(eq(ModuleGrouping.Hash, hash))
        .limit(1);

      if (existingGroup) {
        return existingGroup.GroupID;
      }
    }

    const [group] = await db
      .insert(ModuleGrouping)
      .values(hash ? { Hash: hash } : {})
      .returning();

    if (!group) {
      throw new ConflictException(
        'PDF parser module grouping could not be created',
      );
    }

    if (sortedModuleIds.length > 0) {
      await db.insert(GroupModules).values(
        sortedModuleIds.map((moduleId) => ({
          GroupID: group.GroupID,
          ModuleID: moduleId,
        })),
      );
    }

    return group.GroupID;
  }
}
