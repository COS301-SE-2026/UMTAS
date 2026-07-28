import { Injectable } from '@nestjs/common';
import { BaseSeedService } from '../base.seed.service';

import { DatabaseService } from '../../database.service';

//hashing
import { hashPassword } from 'better-auth/crypto';

//Tables
import { usersTable } from '../../../entities';
import { SeedPersistenceService } from '../seed-persistence.service';

@Injectable()
export class UserSeedService extends BaseSeedService {
  constructor(private readonly persistence: SeedPersistenceService) {
    super();
  }

  async seed(tx: DatabaseService['db']): Promise<void> {
    //Initialise constants
    const userIDs = this.constants.UserIDs;
    const userNames = this.constants.UserNames;
    const userEmails = this.constants.UserEmails;
    const userPasswords = this.constants.UserPasswords;

    //HashPasswords
    const hashedUserPasswords: string[] = await Promise.all(
      userPasswords.map((password) => hashPassword(password)),
    );

    //User obects
    const userObjects = userNames.map((name, index) => ({
      id: userIDs[index],
      name: name,
      email: userEmails[index],
      role: 'user',
      emailVerified: true,
      password: hashedUserPasswords[index],
    }));

    //Get existing users through emails
    const existingEmails = await this.exists(
      tx,
      usersTable,
      usersTable.email,
      userEmails,
    );

    //Missing user Objects
    const missingUsers = userObjects.filter(
      (user) => !existingEmails.has(user.email),
    );

    if (missingUsers.length > 0) {
      //Seed missing users
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

      //Seed in the accounts table
      await this.persistence.insertAccounts(
        tx,
        missingUsers.map((user, index) => ({
          id: `${user.id}-account`,
          userId: newUsers[index].id,
          accountId: newUsers[index].id,
          providerId: 'credential',
          password: user.password,
        })),
      );

      this.logResult('Users', newUsers.length);
    } else {
      this.logResult('Users');
    }
  } //END_seed
} //END_UserSeedService
