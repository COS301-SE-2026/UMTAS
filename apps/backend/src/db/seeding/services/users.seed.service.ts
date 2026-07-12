import { Injectable } from '@nestjs/common';
import { BaseSeedService } from '../base.seed.service';

import { DatabaseService } from 'src/db/database.service';

//hashing
import { hashPassword } from 'better-auth/crypto';

//Tables
import { accountsTable, usersTable } from 'src/entities';

@Injectable()
export class UserSeedService extends BaseSeedService {
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
      'email',
      userEmails,
    );

    //Missing user Objects
    const missingUsers = userObjects.filter(
      (user) => !existingEmails.has(user.email),
    );

    if (missingUsers.length > 0) {
      //Seed missing users
      const newUsers = await tx
        .insert(usersTable)
        .values(
          missingUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified,
          })),
        )
        .returning();

      //Seed in the accounts table
      await tx.insert(accountsTable).values(
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
