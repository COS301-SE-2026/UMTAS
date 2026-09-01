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

    for (const entry of missingCandidates) {
      const code = entry[0];
      const candidate = entry[1];
      const module = await this.createOrFindModule(db, code, candidate);
      resolved.set(module.moduleCode, module);
    }

    return resolved;
  }

  private async createOrFindModule(
    db: AppDatabase,
    code: string,
    candidate: ParsedModuleCandidate,
  ): Promise<ModuleRecord> {
    const normalizedCode = normalizeModuleCode(code);
    const [inserted] = await db
      .insert(modules)
      .values({
        moduleCode: normalizedCode,
        moduleName: truncateForColumn(candidate.name?.trim() || code, 256),
        moduleDescription: candidate.metadata
          ? JSON.stringify(candidate.metadata)
          : null,
        semester: this.moduleSemester(candidate.metadata.semester),
        validated: false,
      })
      .onConflictDoNothing({
        target: modules.moduleCode,
      })
      .returning();

    if (inserted) {
      return inserted;
    }

    const [existing] = await db
      .select()
      .from(modules)
      .where(eq(modules.moduleCode, normalizedCode))
      .limit(1);

    if (!existing) {
      throw new Error(`PDF parser module could not be resolved: ${code}`);
    }

    return existing;
  }

  private moduleSemester(value: unknown): ModuleRecord['semester'] {
    if (
      value === 1 ||
      value === '1' ||
      value === 'S1' ||
      value === 'SEMESTER_1'
    ) {
      return 'SEMESTER_1';
    }
    if (
      value === 2 ||
      value === '2' ||
      value === 'S2' ||
      value === 'SEMESTER_2'
    ) {
      return 'SEMESTER_2';
    }
    return 'YEAR';
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
