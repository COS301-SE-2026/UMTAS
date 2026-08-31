import { Injectable } from '@nestjs/common';
import type { AppDatabase } from '../database.service';
import {
  accountsTable,
  AcademicCalendar,
  CalendarRestriction,
  Course,
  CourseModule,
  Event,
  EventsToTimetables,
  EventVenue,
  GroupModules,
  ModuleEnrollment,
  ModuleGrouping,
  modules,
  ModuleStyling,
  parseJob,
  sessionsTable,
  solverJob,
  Timetable,
  University,
  UniversityEvent,
  UniversityRole,
  usersTable,
  UserTimetable,
  Venue,
} from '../../entities';

@Injectable()
export class SeedPersistenceService {
  insertAcademicCalendars(
    db: AppDatabase,
    values: readonly (typeof AcademicCalendar.$inferInsert)[],
  ) {
    return db
      .insert(AcademicCalendar)
      .values([...values])
      .returning();
  }

  insertCalendarRestrictions(
    db: AppDatabase,
    values: readonly (typeof CalendarRestriction.$inferInsert)[],
  ) {
    return db
      .insert(CalendarRestriction)
      .values([...values])
      .returning();
  }

  insertUsers(
    db: AppDatabase,
    values: readonly (typeof usersTable.$inferInsert)[],
  ) {
    return db
      .insert(usersTable)
      .values([...values])
      .returning();
  }

  insertAccounts(
    db: AppDatabase,
    values: readonly (typeof accountsTable.$inferInsert)[],
  ) {
    return db
      .insert(accountsTable)
      .values([...values])
      .returning();
  }

  insertSessions(
    db: AppDatabase,
    values: readonly (typeof sessionsTable.$inferInsert)[],
  ) {
    return db
      .insert(sessionsTable)
      .values([...values])
      .returning();
  }

  insertUniversities(
    db: AppDatabase,
    values: readonly (typeof University.$inferInsert)[],
  ) {
    return db
      .insert(University)
      .values([...values])
      .returning();
  }

  insertUniversityRoles(
    db: AppDatabase,
    values: readonly (typeof UniversityRole.$inferInsert)[],
  ) {
    return db
      .insert(UniversityRole)
      .values([...values])
      .returning();
  }

  insertGroupings(
    db: AppDatabase,
    values: readonly (typeof ModuleGrouping.$inferInsert)[],
  ) {
    return db
      .insert(ModuleGrouping)
      .values([...values])
      .returning();
  }

  insertCourses(
    db: AppDatabase,
    values: readonly (typeof Course.$inferInsert)[],
  ) {
    return db
      .insert(Course)
      .values([...values])
      .returning();
  }

  insertModules(
    db: AppDatabase,
    values: readonly (typeof modules.$inferInsert)[],
  ) {
    return db
      .insert(modules)
      .values([...values])
      .returning();
  }

  insertGroupModules(
    db: AppDatabase,
    values: readonly (typeof GroupModules.$inferInsert)[],
  ) {
    return db
      .insert(GroupModules)
      .values([...values])
      .returning();
  }

  insertCourseModules(
    db: AppDatabase,
    values: readonly (typeof CourseModule.$inferInsert)[],
  ) {
    return db
      .insert(CourseModule)
      .values([...values])
      .returning();
  }

  insertModuleStylings(
    db: AppDatabase,
    values: readonly (typeof ModuleStyling.$inferInsert)[],
  ) {
    return db
      .insert(ModuleStyling)
      .values([...values])
      .returning();
  }

  insertEvents(
    db: AppDatabase,
    values: readonly (typeof Event.$inferInsert)[],
  ) {
    return db
      .insert(Event)
      .values([...values])
      .returning();
  }

  insertUniversityEvents(
    db: AppDatabase,
    values: readonly (typeof UniversityEvent.$inferInsert)[],
  ) {
    return db
      .insert(UniversityEvent)
      .values([...values])
      .returning();
  }

  insertVenues(
    db: AppDatabase,
    values: readonly (typeof Venue.$inferInsert)[],
  ) {
    return db
      .insert(Venue)
      .values([...values])
      .returning();
  }

  insertEventVenues(
    db: AppDatabase,
    values: readonly (typeof EventVenue.$inferInsert)[],
  ) {
    return db
      .insert(EventVenue)
      .values([...values])
      .returning();
  }

  insertModuleEnrollments(
    db: AppDatabase,
    values: readonly (typeof ModuleEnrollment.$inferInsert)[],
  ) {
    return db
      .insert(ModuleEnrollment)
      .values([...values])
      .returning();
  }

  insertParseJobs(
    db: AppDatabase,
    values: readonly (typeof parseJob.$inferInsert)[],
  ) {
    return db
      .insert(parseJob)
      .values([...values])
      .returning();
  }

  insertSolverJobs(
    db: AppDatabase,
    values: readonly (typeof solverJob.$inferInsert)[],
  ) {
    return db
      .insert(solverJob)
      .values([...values])
      .returning();
  }

  insertTimetables(
    db: AppDatabase,
    values: readonly (typeof Timetable.$inferInsert)[],
  ) {
    return db
      .insert(Timetable)
      .values([...values])
      .returning();
  }

  insertUserTimetables(
    db: AppDatabase,
    values: readonly (typeof UserTimetable.$inferInsert)[],
  ) {
    return db
      .insert(UserTimetable)
      .values([...values])
      .returning();
  }

  insertEventsToTimetables(
    db: AppDatabase,
    values: readonly (typeof EventsToTimetables.$inferInsert)[],
  ) {
    return db
      .insert(EventsToTimetables)
      .values([...values])
      .returning();
  }
}
