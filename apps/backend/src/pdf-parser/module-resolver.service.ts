import { Injectable } from '@nestjs/common';
import { and, eq, inArray, or } from 'drizzle-orm';
import type { ParsedModuleCandidate } from 'shared-types';
import type { AppDatabase } from '../db/database.service';
import { Course, GroupModules, modules, parseJob } from '../entities';
import {
  normalizeModuleCode,
  truncateForColumn,
} from './pdf-parser-import.utils';

export type ModuleRecord = typeof modules.$inferSelect;

@Injectable()
export class ModuleResolver {
  async resolveForUniversity(
    db: AppDatabase,
    universityId: string,
    candidates: Map<string, ParsedModuleCandidate>,
  ): Promise<Map<string, ModuleRecord>> {
    const resolved = new Map<string, ModuleRecord>();
    const codes = Array.from(candidates.keys());

    if (codes.length > 0) {
      const existingRows = await this.findModulesOwnedByUniversityViaGroupLinks(
        db,
        universityId,
        codes,
      );

      for (const row of existingRows) {
        if (!resolved.has(row.module.moduleCode)) {
          resolved.set(row.module.moduleCode, row.module);
        }
      }
    }

    const missingCandidates = Array.from(candidates.entries()).filter(
      ([code]) => !resolved.has(code),
    );

    if (missingCandidates.length === 0) {
      return resolved;
    }

    const inserted = await db
      .insert(modules)
      .values(
        missingCandidates.map(([code, candidate]) => ({
          moduleCode: normalizeModuleCode(code),
          moduleName: truncateForColumn(candidate.name?.trim() || code, 256),
          moduleDescription: candidate.metadata
            ? JSON.stringify(candidate.metadata)
            : null,
          validated: false,
        })),
      )
      .returning();

    for (const module of inserted) {
      resolved.set(module.moduleCode, module);
    }

    return resolved;
  }

  private async findModulesOwnedByUniversityViaGroupLinks(
    db: AppDatabase,
    universityId: string,
    codes: string[],
  ): Promise<{ module: ModuleRecord }[]> {
    // Modules have no direct university owner. Reuse is intentionally limited to
    // modules linked through a university course or an earlier parser job.
    return db
      .select({
        module: modules,
      })
      .from(modules)
      .innerJoin(GroupModules, eq(GroupModules.ModuleID, modules.moduleID))
      .leftJoin(Course, eq(Course.GroupID, GroupModules.GroupID))
      .leftJoin(parseJob, eq(parseJob.GroupID, GroupModules.GroupID))
      .where(
        and(
          inArray(modules.moduleCode, codes),
          or(
            eq(Course.UniversityID, universityId),
            eq(parseJob.UniversityID, universityId),
          ),
        ),
      );
  }
}
