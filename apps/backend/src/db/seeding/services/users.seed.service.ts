import { Injectable } from '@nestjs/common';
import { BaseSeedService } from '../base.seed.service';

import { DatabaseService } from '../../database.service';

// Hashing
import { hashPassword } from 'better-auth/crypto';

// Drizzle
import { and, eq, inArray } from 'drizzle-orm';
import { InferSelectModel } from 'drizzle-orm';

// Tables
import {
  RoleTypeType,
  University,
  UniversityRole,
  usersTable,
} from '../../../entities';

import { SeedPersistenceService } from '../seed-persistence.service';

const LECTURER_EMAIL = process.env.LECTURER_EMAIL || undefined;
const LECTURER_PASSWORD = process.env.LECTURER_PASSWORD || undefined;

const STUDENT_PASSWORD = process.env.NOT_A_PASSWORD;

type UniversityRecord = InferSelectModel<typeof University>;

@Injectable()
export class UserSeedService extends BaseSeedService {
  constructor(private readonly persistence: SeedPersistenceService) {
    super();
  }

  async seed(tx: DatabaseService['db']): Promise<void> {
    // Get all universities
    const universities = await tx.select().from(University);

    // Seed the standard users
    const newUsers = await this.seedUsers(tx, {
      names: this.constants.UserNames,
      emails: this.constants.UserEmails,
      password: STUDENT_PASSWORD,
    });

    // Assign the configured university role to each newly-created user
    for (const user of newUsers) {
      await this.seedUserUniversityRoles(tx, user.id, 'STUDENT', universities);
    }

    this.logResult('UniversityRoles', newUsers.length * 2);

    // Seed the lecturer
    await this.seedLecturer(tx, universities);
  } // END_seed

  private async seedLecturer(
    tx: DatabaseService['db'],
    universities: UniversityRecord[],
  ): Promise<void> {
    // Ensure the lecturer credentials are present
    if (!LECTURER_EMAIL || !LECTURER_PASSWORD) {
      this.logger.warn(
        'Lecturer could not be seeded due to missing environment variables.',
      );
      return;
    }

    // Seed lecturer user
    const newUsers = await this.seedUsers(tx, {
      names: ['lecturer'],
      emails: [LECTURER_EMAIL],
      password: LECTURER_PASSWORD,
    });

    // Assign role
    for (const user of newUsers) {
      await this.seedUserUniversityRoles(tx, user.id, 'LECTURER', universities);
    }
  } //END_seedLecturer

  private async seedUsers(
    tx: DatabaseService['db'],
    options: {
      ids?: string[];
      names: string[];
      emails: string[];
      password: string | undefined;
    },
  ): Promise<(typeof usersTable.$inferSelect)[]> {
    const userIDs = options.ids;
    const userNames = options.names;
    const userEmails = options.emails;

    if (!options.password) {
      this.logger.warn(
        'Users could not be seeded due to missing NOT_A_PASSWORD environment variable.',
      );
      return [];
    }

    // Ensure names and emails have matching lengths
    if (userNames.length !== userEmails.length) {
      this.logger.warn(
        `Names length [${userNames.length}] does not match emails length [${userEmails.length}].`,
      );
      return [];
    }

    if (userIDs && userIDs.length !== userEmails.length) {
      this.logger.warn(
        `IDs length [${userIDs.length}] does not match emails length [${userEmails.length}].`,
      );
      return [];
    }

    const hashedPassword = await hashPassword(options.password);

    const userObjects = userEmails.map((email, index) => ({
      id: userIDs?.[index],
      name: userNames[index],
      email,
      role: 'user',
      emailVerified: true,
      password: hashedPassword,
    }));

    // Get existing users through their emails
    const existingEmails = await this.exists(
      tx,
      usersTable,
      usersTable.email,
      userEmails,
    );

    // Get users that do not already exist
    const missingUsers = userObjects.filter(
      (user) => !existingEmails.has(user.email),
    );

    if (missingUsers.length === 0) {
      this.logResult('Users');
      return [];
    }

    const newUsers = await this.persistence.insertUsers(
      tx,
      missingUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      })),
    );

    await this.persistence.insertAccounts(
      tx,
      missingUsers.map((user, index) => ({
        id: `${newUsers[index].id}-account`,
        userId: newUsers[index].id,
        accountId: newUsers[index].id,
        providerId: 'credential',
        password: user.password,
      })),
    );

    this.logResult('Users', newUsers.length);

    return newUsers;
  } // END_seedUsers

  private async seedUserUniversityRoles(
    tx: DatabaseService['db'],
    userID: string,
    role: RoleTypeType,
    universities: UniversityRecord[],
  ): Promise<void> {
    // Ensure universities have been seeded
    if (universities.length === 0) {
      this.logger.warn(
        `University role [${role}] could not be assigned to user [${userID}] because no universities exist.`,
      );
      return;
    }

    // Get all university IDs
    const universityIDs = universities.map(
      (university) => university.UniversityID,
    );

    // Get existing university roles for this user
    const existingRoles = await tx
      .select()
      .from(UniversityRole)
      .where(
        and(
          eq(UniversityRole.UserID, userID),
          inArray(UniversityRole.UniversityID, universityIDs),
        ),
      );

    // Get university IDs for which the user already has a role
    const existingUniversityIDs = new Set(
      existingRoles.map((userRole) => userRole.UniversityID),
    );

    // Create roles for universities where the user does not already have one
    const missingRoles = universities
      .filter(
        (university) => !existingUniversityIDs.has(university.UniversityID),
      )
      .map((university) => ({
        UserID: userID,
        UniversityID: university.UniversityID,
        role,
      }));

    // No new university roles need to be seeded
    if (missingRoles.length === 0) {
      this.logResult('UniversityRoles');
      return;
    }

    // Seed missing university roles
    await this.persistence.insertUniversityRoles(tx, missingRoles);
  } //END_seedUserUniversityRoles
} //END_UserSeedService
