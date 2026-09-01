import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database.service';
import { BaseSeedService } from '../base.seed.service';
import { University, usersTable } from '../../../entities';
import { eq, ilike } from 'drizzle-orm';
import { SeedPersistenceService } from '../seed-persistence.service';
import { AppDatabase } from 'src/auth/auth';

@Injectable()
export class UniversitySeedService extends BaseSeedService {
  constructor(private readonly persistence: SeedPersistenceService) {
    super();
  }

  async seed(tx: DatabaseService['db']): Promise<void> {
    //University names to seed
    const uniNames = this.constants.UniversityNames;

    //Get Names of universities that already exist
    const existingNames = await this.exists(
      tx,
      University,
      University.UniversityName,
      uniNames,
    );

    const missingNames = uniNames.filter((name) => !existingNames.has(name));

    //Seed missingNames into University table
    if (missingNames.length > 0) {
      //Seed only missing names
      const uniSeed = await this.persistence.insertUniversities(
        tx,
        missingNames.map((name) => ({ UniversityName: name })),
      );

      //Log amount of Unis successfully seeded
      this.logResult('Universities', uniSeed.length);

      // if University of pretroia had to be seeded -> seed in uni_admin for it <=================================Might remove later :)
      for (const uni of uniSeed) {
        const [uniAdmin] = await tx
          .select()
          .from(usersTable)
          .where(
            eq(
              usersTable.email,
              process.env.SEED_SYSTEM_ADMIN_EMAIL ?? 'system-admin@local.umtas',
            ),
          );

        const [cosAdmin] = await tx
          .select()
          .from(usersTable)
          .where(
            eq(
              usersTable.email,
              process.env.SEED_COS_ADMIN_EMAIL?.toLowerCase() ??
                'admin301@local.umtas',
            ),
          );

        await this.persistence.insertUniversityRoles(tx, [
          {
            UniversityID: uni.UniversityID,
            UserID: uniAdmin.id,
            role: 'UNIVERSITY_ADMIN',
          },
          {
            UniversityID: uni.UniversityID,
            UserID: cosAdmin.id,
            role: 'UNIVERSITY_ADMIN',
          },
        ]);
      } //END_uni
    } //END_check for missing names
    else {
      //No new unis to seed
      this.logResult('Universities');
    }

    await this.MarylandAPI(tx);
  } //END_seed

  //🎅's little helpers

  async MarylandAPI(tx: AppDatabase) {
    const [maryland] = await tx
      .select()
      .from(University)
      .where(ilike(University.UniversityName, `%Maryland%`))
      .limit(1);

    //update with api information
    const apiInfo = {
      ApiIdentifier: 'ML',
      BaseApiUrl: 'https://api.umd.io/v1',
    };

    await tx
      .update(University)
      .set(apiInfo)
      .where(eq(University.UniversityID, maryland.UniversityID));
  }
} //UniversitySeedService
