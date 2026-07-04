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
    const sortedModuleIds = uniqueSortedValues(moduleIds);
    const hash =
      sortedModuleIds.length > 0 ? hashModuleIds(sortedModuleIds) : null;

    if (hash) {
      const [existingGroup] = await db
        .select()
        .from(ModuleGrouping)
        .where(eq(ModuleGrouping.Hash, hash))
        .limit(1);

      if (existingGroup) {
        await this.assertGroupModulesMatch(
          db,
          existingGroup.GroupID,
          sortedModuleIds,
        );
        return existingGroup.GroupID;
      }
    }

    const [group] = await db
      .insert(ModuleGrouping)
      .values(hash ? { Hash: hash } : {})
      .onConflictDoNothing({
        target: ModuleGrouping.Hash,
      })
      .returning();

    if (!group && hash) {
      const [conflictingGroup] = await db
        .select()
        .from(ModuleGrouping)
        .where(eq(ModuleGrouping.Hash, hash))
        .limit(1);

      if (conflictingGroup) {
        await this.assertGroupModulesMatch(
          db,
          conflictingGroup.GroupID,
          sortedModuleIds,
        );
        return conflictingGroup.GroupID;
      }
    }

    if (!group) {
      throw new ConflictException(
        'PDF parser module grouping could not be created',
      );
    }

    if (sortedModuleIds.length > 0) {
      for (const moduleId of sortedModuleIds) {
        await db
          .insert(GroupModules)
          .values({
            GroupID: group.GroupID,
            ModuleID: moduleId,
          })
          .onConflictDoNothing({
            target: [GroupModules.GroupID, GroupModules.ModuleID],
          });
      }
    }

    return group.GroupID;
  }

  private async assertGroupModulesMatch(
    db: AppDatabase,
    groupId: string,
    sortedModuleIds: string[],
  ): Promise<void> {
    const rows = await db
      .select({
        moduleId: GroupModules.ModuleID,
      })
      .from(GroupModules)
      .where(eq(GroupModules.GroupID, groupId));

    const existingModuleIds: string[] = [];
    for (const row of rows) {
      existingModuleIds.push(row.moduleId);
    }
    existingModuleIds.sort();

    if (!sameStringList(existingModuleIds, sortedModuleIds)) {
      throw new ConflictException(
        'PDF parser module grouping hash does not match group membership',
      );
    }
  }
}

function uniqueSortedValues(values: string[]): string[] {
  const seen = new Set<string>();
  const uniqueValues: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    uniqueValues.push(value);
  }

  uniqueValues.sort();
  return uniqueValues;
}

function sameStringList(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}
