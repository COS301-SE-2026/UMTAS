import {
  EventAttendance,
  ModuleEnrollment,
  ModuleStyling,
  usersTable,
  UserTimetable,
} from 'src/entities';
import { AppDatabase } from './auth';
import { eq, inArray, sql } from 'drizzle-orm';
import { UserEmails } from 'src/db/seeding/Constants';
import { Logger } from '@nestjs/common';

const logger = new Logger('Guest_User_Cloner');

export async function cloneSeededUserData(
  tx: AppDatabase,
  guestUserId: string,
): Promise<void> {
  const [templateUser] = await tx
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      inArray(
        sql`lower(${usersTable.email})`,
        UserEmails.map((email) => email.toLowerCase()),
      ),
    )
    .limit(1);

  if (!templateUser) {
    logger.warn('No seeded template user found, guest will start with no data');
    return;
  }

  // Module enrollments
  const enrollments = await tx
    .select()
    .from(ModuleEnrollment)
    .where(eq(ModuleEnrollment.UserID, templateUser.id));

  if (enrollments.length > 0) {
    await tx
      .insert(ModuleEnrollment)
      .values(
        enrollments.map((enrollment) => ({
          ModuleID: enrollment.ModuleID,
          UserID: guestUserId,
        })),
      )
      .onConflictDoNothing();
  }

  // Module styling
  const stylings = await tx
    .select()
    .from(ModuleStyling)
    .where(eq(ModuleStyling.UserID, templateUser.id));

  if (stylings.length > 0) {
    await tx
      .insert(ModuleStyling)
      .values(
        stylings.map((styling) => ({
          ModuleID: styling.ModuleID,
          UserID: guestUserId,
          styling: styling.styling,
        })),
      )
      .onConflictDoNothing();
  }

  // attendance
  const attendances = await tx
    .select()
    .from(EventAttendance)
    .where(eq(EventAttendance.UserID, templateUser.id));

  const BATCH_SIZE = 1000;

  for (let i = 0; i < attendances.length; i += BATCH_SIZE) {
    await tx.insert(EventAttendance).values(
      attendances.slice(i, i + BATCH_SIZE).map((attendance) => ({
        eventID: attendance.eventID,
        UserID: guestUserId,
        eventDate: attendance.eventDate,
        state: attendance.state,
      })),
    );
  }

  //Timetable
  const userTimetables = await tx
    .select()
    .from(UserTimetable)
    .where(eq(UserTimetable.UserID, templateUser.id));

  if (userTimetables.length > 0) {
    await tx.insert(UserTimetable).values(
      userTimetables.map((userTimetable) => ({
        UserID: guestUserId,
        TimetableID: userTimetable.TimetableID,
      })),
    );
  }

  logger.log(
    `Cloned seeded data onto guest[${guestUserId}]: ${enrollments.length} enrollments, ${stylings.length} stylings, ${attendances.length} attendances, ${userTimetables.length} timetables`,
  );
} //END_cloneSeededUserData
