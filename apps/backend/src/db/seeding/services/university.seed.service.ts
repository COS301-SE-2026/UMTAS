import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database.service';
import { BaseSeedService } from '../base.seed.service';
import { University, usersTable } from '../../../entities';
import { eq } from 'drizzle-orm';
import { SeedPersistenceService } from '../seed-persistence.service';

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
      if (missingNames.includes(uniNames[0])) {
        const [uniAdmin] = await tx
          .select()
          .from(usersTable)
          .where(
            eq(
              usersTable.email,
              process.env.SEED_SYSTEM_ADMIN_EMAIL ?? 'system-admin@local.umtas',
            ),
          );

        await this.persistence.insertUniversityRoles(tx, [
          {
            UniversityID: uniSeed[0].UniversityID,
            UserID: uniAdmin.id,
            role: 'UNIVERSITY_ADMIN',
          },
        ]);
      }
    } //END_check for missing names
    else {
      //No new unis to seed
      this.logResult('Universities');
    }
  } //END_seed
} //UniversitySeedService
