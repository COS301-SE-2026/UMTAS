import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import {
  ModuleTeaches,
  UniversityRole,
  modules,
  usersTable,
} from '../../../entities';
import type { AppDatabase } from '../../database.service';
import { BaseSeedService } from '../base.seed.service';
import { SeedQueryService } from './seed-query.service';

// Makes every Pretoria university admin and every system admin teach the
// attendance demo modules. Must run after EventsSeedService.
@Injectable()
export class AttendanceDemoAdminsSeedService extends BaseSeedService {
  constructor(private readonly query: SeedQueryService) {
    super();
  }

  async seed(db: AppDatabase): Promise<void> {
    const universityId = await this.query.getUniversityIDByName(db, 'Pretoria');
    if (!universityId) {
      this.logger.warn(
        'University of Pretoria is missing; skipping attendance demo admins',
      );
      return;
    }

    const moduleRows = await db
      .select({ id: modules.moduleID })
      .from(modules)
      .where(
        inArray(
          modules.moduleCode,
          this.constants.ATTENDANCE_DEMO_MODULE_CODES,
        ),
      );

    const universityAdmins = await db
      .select({ id: UniversityRole.UserID })
      .from(UniversityRole)
      .where(
        and(
          eq(UniversityRole.UniversityID, universityId),
          eq(UniversityRole.role, 'UNIVERSITY_ADMIN'),
        ),
      );
    const systemAdmins = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, 'sys_admin'));

    const userIds = [
      ...new Set([...universityAdmins, ...systemAdmins].map((u) => u.id)),
    ];

    if (moduleRows.length === 0 || userIds.length === 0) {
      this.logger.warn(
        'Attendance demo modules or admins are missing; skipping attendance demo admins',
      );
      return;
    }

    const inserted = await db
      .insert(ModuleTeaches)
      .values(
        userIds.flatMap((UserID) =>
          moduleRows.map((module) => ({ ModuleID: module.id, UserID })),
        ),
      )
      .onConflictDoNothing()
      .returning();

    this.logResult('attendance demo admin ModuleTeaches', inserted.length);
  }
}
