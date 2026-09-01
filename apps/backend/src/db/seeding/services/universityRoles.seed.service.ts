import { Injectable } from '@nestjs/common';
import { BaseSeedService } from '../base.seed.service';

import { DatabaseService } from '../../database.service';
import { eq, inArray, and, ilike, or } from 'drizzle-orm';

//Tables
import { University, UniversityRole, usersTable } from '../../../entities';
import { SeedPersistenceService } from '../seed-persistence.service';

@Injectable()
export class UniRolesSeedService extends BaseSeedService {
  constructor(private readonly persistence: SeedPersistenceService) {
    super();
  }

  async seed(tx: DatabaseService['db']): Promise<void> {
    const universities = await tx
      .select()
      .from(University)
      .where(
        or(
          ilike(University.UniversityName, `%Pretoria%`),
          ilike(University.UniversityName, `%Maryland%`),
        ),
      );

    //Users for which to create roles -> fetched by their emails
    const userEmails = this.constants.UserEmails;
    const users = await tx
      .select()
      .from(usersTable)
      .where(inArray(usersTable.email, userEmails));
    const userIDs = users.map((user) => user.id);

    //Array of roles to be assigned
    const userUniRoles = this.constants.UserUniRoles;

    for (const uni of universities) {
      //Create role objects that will be used
      const uniRoles = userIDs.map((id, index) => ({
        UserID: id,
        UniversityID: uni.UniversityID,
        role: userUniRoles[index],
      }));

      //Fetch existing roles for the userId's & uniId
      const existingRoles = await tx
        .select()
        .from(UniversityRole)
        .where(
          and(
            eq(UniversityRole.UniversityID, uni.UniversityID),
            inArray(UniversityRole.UserID, userIDs),
          ),
        );

      //Existing UserID's in the uniRole table
      const existingIDs = new Set(existingRoles.map((role) => role.UserID));

      //Get the missing roles from the roles object using the existing User ID's
      const missingRoles = uniRoles.filter(
        (role) => !existingIDs.has(role.UserID),
      );

      if (missingRoles.length > 0) {
        //Seed in the missingRoles
        const uniRoles = await this.persistence.insertUniversityRoles(
          tx,
          missingRoles,
        );

        this.logResult('UniversityRoles', uniRoles.length);
      } else {
        this.logResult('UniversityRoles');
      }
    } //END_uni
  } //END_seed
} //END_BaseSeedService
