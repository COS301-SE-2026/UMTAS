import { Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { ModuleTeaches, modules, usersTable } from '../../../entities';
import type { AppDatabase } from '../../database.service';
import { BaseSeedService } from '../base.seed.service';
import { getCosAdminEmail, getSystemAdminEmail } from '../Constants';

@Injectable()
export class AdminTeachingSeedService extends BaseSeedService {
  async seed(db: AppDatabase): Promise<void> {
    const codes = this.constants.ALL_SEED_MODULES.map((module) => module.Code);
    const moduleRows = await db
      .select({ id: modules.moduleID })
      .from(modules)
      .where(inArray(modules.moduleCode, codes));

    const adminIds: string[] = [];
    for (const email of [getCosAdminEmail(), getSystemAdminEmail()]) {
      const [admin] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (!admin) {
        this.logger.warn(
          `Admin [${email}] is missing; skipping module teaching`,
        );
        continue;
      }
      adminIds.push(admin.id);
    }

    const values = adminIds.flatMap((UserID) =>
      moduleRows.map((module) => ({ ModuleID: module.id, UserID })),
    );

    if (values.length === 0) {
      this.logResult('admin ModuleTeaches');
      return;
    }

    const inserted = await db
      .insert(ModuleTeaches)
      .values(values)
      .onConflictDoNothing()
      .returning();

    this.logResult('admin ModuleTeaches', inserted.length);
  }
}
