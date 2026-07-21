import { Injectable } from '@nestjs/common';

import { DatabaseService } from 'src/db/database.service';
import { BaseSeedService } from '../base.seed.service';
import { University, UniversityRole, usersTable } from 'src/entities';
import { eq } from 'drizzle-orm';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class UniversitySeedService extends BaseSeedService {
  constructor(protected readonly configService: ConfigService) {
    super(configService);
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
      const uniSeed = await tx
        .insert(University)
        .values(missingNames.map((name) => ({ UniversityName: name })))
        .returning();

      //Log amount of Unis successfully seeded
      this.logResult('Universities', uniSeed.length);

      // if University of pretroia had to be seeded -> seed in uni_admin for it <=================================Might remove later :)
      if (missingNames.includes(uniNames[0])) {
        const [uniAdmin] = await tx
          .select()
          .from(usersTable)
          .where(
            eq(
              usersTable.name,
              this.configService.get<string>('SEED_SYSTEM_ADMIN_NAME') ??
                'System Admin',
            ),
          );

        await tx.insert(UniversityRole).values({
          UniversityID: uniSeed[0].UniversityID,
          UserID: uniAdmin.id,
          role: 'UNIVERSITY_ADMIN',
        });
      }
    } //END_check for missing names
    else {
      //No new unis to seed
      this.logResult('Universities');
    }
  } //END_seed
} //UniversitySeedService
