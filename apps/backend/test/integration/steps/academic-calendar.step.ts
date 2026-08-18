import assert from 'node:assert/strict';
import { and, eq } from 'drizzle-orm';
import {
  AcademicCalendar,
  CalendarRestriction,
  GeneratedCalendar,
  UniversityRole,
} from '../../../src/entities';
import {
  flowKey,
  type FlowKey,
  type OutputIntegrationStep,
} from '../framework/contracts';
import type { AuthenticationStepOutput } from './authentication.step';
import type { PersonalEventOutput } from './event.step';
import {
  expectObject,
  expectStatus,
  expectString,
  type ActorResolver,
} from './step-support';
import type { UniversityOutput } from './university.step';

export const UNIVERSITY_ADMIN_SELECTION_STEP_NAME =
  'select a university as an administrator';
export const ACADEMIC_CALENDAR_LIFECYCLE_STEP_NAME =
  'manage and generate an academic calendar';

export type UniversityAdminSelectionPlan = {
  readonly authenticationKey: FlowKey<AuthenticationStepOutput>;
  readonly universityKey: FlowKey<UniversityOutput>;
  readonly calendarYear: number;
};

export type UniversityAdminSelectionOutput = {
  readonly userId: string;
  readonly universityId: string;
};

export function universityAdminSelectionStep<TPlan>(
  select: (plan: TPlan) => UniversityAdminSelectionPlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, UniversityAdminSelectionOutput> {
  return {
    name: UNIVERSITY_ADMIN_SELECTION_STEP_NAME,
    outputKey: flowKey<UniversityAdminSelectionOutput>(
      'university.admin-selection',
    ),
    async run(context) {
      const plan = select(context.plan);
      const authentication = context.require(plan.authenticationKey);
      const university = context.require(plan.universityKey);
      const administrator = await actor(context);

      const application = await administrator.request.post(
        '/universities/apply',
        {
          json: {
            UniversityID: university.UniversityID,
            role: 'STUDENT',
          },
        },
      );
      expectStatus(application, 201, 'apply for university membership');

      const studentSelection = await administrator.request.post(
        '/auth/select-university',
        { json: { uniId: university.UniversityID } },
      );
      expectStatus(
        studentSelection,
        [200, 201],
        'select university as student',
      );

      const forbidden = await administrator.request.post('/academic-calendar', {
        json: { year: plan.calendarYear },
      });
      expectStatus(forbidden, 403, 'reject calendar creation by student');

      await context.runtime.database
        .update(UniversityRole)
        .set({ role: 'UNIVERSITY_ADMIN' })
        .where(
          and(
            eq(UniversityRole.UserID, authentication.userId),
            eq(UniversityRole.UniversityID, university.UniversityID),
          ),
        );

      const selected = await administrator.request.post(
        '/auth/select-university',
        { json: { uniId: university.UniversityID } },
      );
      expectStatus(selected, [200, 201], 'select university as administrator');
      expectObject(selected.body, 'select university as administrator');
      assert.equal(selected.body.uniId, university.UniversityID);
      assert.equal(selected.body.uniRole, 'uni_admin');

      const roles = await context.runtime.database
        .select()
        .from(UniversityRole)
        .where(
          and(
            eq(UniversityRole.UserID, authentication.userId),
            eq(UniversityRole.UniversityID, university.UniversityID),
          ),
        );
      assert.equal(roles.length, 1);
      assert.equal(roles[0].role, 'UNIVERSITY_ADMIN');

      return {
        userId: authentication.userId,
        universityId: university.UniversityID,
      };
    },
  };
}

export type AcademicCalendarLifecyclePlan = {
  readonly adminSelectionKey: FlowKey<UniversityAdminSelectionOutput>;
  readonly eventKey: FlowKey<PersonalEventOutput>;
  readonly calendarYear: number;
};

export type AcademicCalendarLifecycleOutput = {
  readonly calendarId: string;
  readonly generatedCalendarId: string;
};

type RestrictionInput = {
  readonly type: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly description?: string;
  readonly replacementWeekday?: string;
};

export function academicCalendarLifecycleStep<TPlan>(
  select: (plan: TPlan) => AcademicCalendarLifecyclePlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, AcademicCalendarLifecycleOutput> {
  return {
    name: ACADEMIC_CALENDAR_LIFECYCLE_STEP_NAME,
    outputKey: flowKey<AcademicCalendarLifecycleOutput>(
      'academic-calendar.lifecycle',
    ),
    async run(context) {
      const plan = select(context.plan);
      const adminSelection = context.require(plan.adminSelectionKey);
      const event = context.require(plan.eventKey);
      const administrator = await actor(context);
      const year = String(plan.calendarYear);
      const daySwapDate = `${year}-08-14`;
      const replacementWeekday =
        new Date(`${daySwapDate}T00:00:00Z`).getUTCDay() === 1
          ? 'TUESDAY'
          : 'MONDAY';

      const created = await administrator.request.post('/academic-calendar', {
        json: { year: plan.calendarYear },
      });
      expectStatus(created, 201, 'create academic calendar');
      expectObject(created.body, 'create academic calendar');
      expectString(created.body.id, 'academic calendar ID');
      assert.equal(created.body.year, plan.calendarYear);
      const calendarId = created.body.id;

      const duplicate = await administrator.request.post('/academic-calendar', {
        json: { year: plan.calendarYear },
      });
      expectStatus(duplicate, 409, 'reject duplicate academic calendar');

      const fetched = await administrator.request.get(
        `/academic-calendar/${calendarId}`,
      );
      expectStatus(fetched, 200, 'retrieve academic calendar');
      expectObject(fetched.body, 'retrieve academic calendar');
      assert.deepEqual(fetched.body, {
        id: calendarId,
        year: plan.calendarYear,
      });

      const invalidRestriction = await administrator.request.post(
        `/academic-calendar/${calendarId}/restrictions`,
        {
          json: {
            type: 'PUBLIC_HOLIDAY',
            startDate: `${plan.calendarYear + 1}-01-01`,
          },
        },
      );
      expectStatus(
        invalidRestriction,
        422,
        'reject restriction outside calendar year',
      );

      const restrictionInputs: RestrictionInput[] = [
        {
          type: 'SEMESTER_1_START',
          startDate: `${year}-02-02`,
          description: 'Semester one starts',
        },
        {
          type: 'SEMESTER_1_END',
          startDate: `${year}-06-19`,
          description: 'Semester one ends',
        },
        {
          type: 'SEMESTER_2_START',
          startDate: `${year}-07-20`,
          description: 'Semester two starts',
        },
        {
          type: 'SEMESTER_2_END',
          startDate: `${year}-11-27`,
          description: 'Semester two ends',
        },
        {
          type: 'PUBLIC_HOLIDAY',
          startDate: `${year}-04-27`,
          description: 'Freedom Day',
        },
        {
          type: 'DAY_SWAP',
          startDate: daySwapDate,
          description: `Use ${replacementWeekday.toLowerCase()} timetable`,
          replacementWeekday,
        },
      ];
      const restrictionIds = new Map<string, string>();
      for (const input of restrictionInputs) {
        const response = await administrator.request.post(
          `/academic-calendar/${calendarId}/restrictions`,
          { json: input },
        );
        expectStatus(response, 201, `create ${input.type} restriction`);
        expectObject(response.body, `create ${input.type} restriction`);
        expectString(response.body.id, `${input.type} restriction ID`);
        assert.equal(response.body.type, input.type);
        assert.equal(response.body.startDate, input.startDate);
        assert.equal(response.body.endDate, input.endDate ?? input.startDate);
        assert.equal(response.body.description, input.description ?? '');
        restrictionIds.set(input.type, response.body.id);
      }

      const holidayId = restrictionIds.get('PUBLIC_HOLIDAY');
      assert.ok(holidayId);
      const updatedHoliday = await administrator.request.put(
        `/academic-calendar/${calendarId}/restrictions/${holidayId}`,
        {
          json: {
            type: 'UNIVERSITY_CLOSURE',
            startDate: `${year}-04-27`,
            endDate: `${year}-04-28`,
            description: 'Campus closed',
          },
        },
      );
      expectStatus(updatedHoliday, 200, 'update calendar restriction');
      expectObject(updatedHoliday.body, 'update calendar restriction');
      assert.equal(updatedHoliday.body.type, 'UNIVERSITY_CLOSURE');
      assert.equal(updatedHoliday.body.endDate, `${year}-04-28`);

      const listed = await administrator.request.get(
        `/academic-calendar/${calendarId}/restrictions`,
      );
      expectStatus(listed, 200, 'list calendar restrictions');
      expectObject(listed.body, 'list calendar restrictions');
      assert.ok(Array.isArray(listed.body.restrictions));
      assert.equal(listed.body.restrictions.length, restrictionInputs.length);
      const listedDates = listed.body.restrictions.map(
        (item: { startDate: string }) => item.startDate,
      );
      assert.deepEqual(listedDates, [...listedDates].sort());

      const timetable = await administrator.request.post('/timetables', {
        json: {
          timetableName: 'Academic calendar source',
          eventIds: [event.eventId],
        },
      });
      expectStatus(timetable, 201, 'create calendar source timetable');
      expectObject(timetable.body, 'create calendar source timetable');
      expectObject(timetable.body.timetable, 'calendar source timetable');
      expectString(
        timetable.body.timetable.timetableID,
        'calendar source timetable ID',
      );
      const timetableId = timetable.body.timetable.timetableID;

      const generated = await administrator.request.post(
        '/academic-calendar/generate',
        { json: { timetableId } },
      );
      expectStatus(generated, 201, 'generate academic calendar snapshot');
      expectObject(generated.body, 'generate academic calendar snapshot');
      expectString(generated.body.id, 'generated academic calendar ID');
      expectObject(
        generated.body.payload,
        'generated academic calendar payload',
      );
      assert.equal(generated.body.payload.year, plan.calendarYear);
      assert.equal(generated.body.payload.name, 'Academic calendar source');
      assert.ok(Array.isArray(generated.body.payload.oneOffEvents));
      const oneOffEvents = generated.body.payload.oneOffEvents as unknown[];
      assert.equal(oneOffEvents.length, 1);
      const oneOffEvent = oneOffEvents[0];
      expectObject(oneOffEvent, 'generated one-off event');
      assert.equal(oneOffEvent.date, event.eventDate);
      assert.ok(Array.isArray(generated.body.payload.allDayEvents));
      const allDayEvents = generated.body.payload.allDayEvents as unknown[];
      assert.equal(allDayEvents.length, 1);
      const allDayEvent = allDayEvents[0];
      expectObject(allDayEvent, 'generated academic calendar all-day event');
      assert.equal(allDayEvent.type, 'UNIVERSITY_CLOSURE');
      const generatedCalendarId = generated.body.id;

      const retrievedSnapshot = await administrator.request.get(
        `/academic-calendar/generate/${generatedCalendarId}`,
      );
      expectStatus(retrievedSnapshot, 200, 'retrieve generated calendar');
      expectObject(retrievedSnapshot.body, 'retrieve generated calendar');
      assert.deepEqual(retrievedSnapshot.body, generated.body);

      const [calendars, restrictions, snapshots] = await Promise.all([
        context.runtime.database
          .select()
          .from(AcademicCalendar)
          .where(eq(AcademicCalendar.id, calendarId)),
        context.runtime.database
          .select()
          .from(CalendarRestriction)
          .where(eq(CalendarRestriction.academicCalendarId, calendarId)),
        context.runtime.database
          .select()
          .from(GeneratedCalendar)
          .where(eq(GeneratedCalendar.id, generatedCalendarId)),
      ]);
      assert.equal(calendars.length, 1);
      assert.equal(calendars[0].universityId, adminSelection.universityId);
      assert.equal(restrictions.length, restrictionInputs.length);
      assert.equal(snapshots.length, 1);
      assert.equal(snapshots[0].timetableId, timetableId);

      const protectedDeletion = await administrator.request.delete(
        `/academic-calendar/${calendarId}`,
      );
      expectStatus(
        protectedDeletion,
        409,
        'protect calendar referenced by generated snapshot',
      );

      const timetableDeletion = await administrator.request.delete(
        `/timetables/${timetableId}`,
      );
      expectStatus(timetableDeletion, 200, 'delete calendar source timetable');

      const daySwapId = restrictionIds.get('DAY_SWAP');
      assert.ok(daySwapId);
      const restrictionDeletion = await administrator.request.delete(
        `/academic-calendar/${calendarId}/restrictions/${daySwapId}`,
      );
      expectStatus(restrictionDeletion, 200, 'delete calendar restriction');
      expectObject(restrictionDeletion.body, 'delete calendar restriction');
      assert.equal(restrictionDeletion.body.success, true);

      const calendarDeletion = await administrator.request.delete(
        `/academic-calendar/${calendarId}`,
      );
      expectStatus(calendarDeletion, 200, 'delete academic calendar');
      expectObject(calendarDeletion.body, 'delete academic calendar');
      assert.equal(calendarDeletion.body.success, true);

      const [remainingCalendars, remainingRestrictions, remainingSnapshots] =
        await Promise.all([
          context.runtime.database
            .select()
            .from(AcademicCalendar)
            .where(eq(AcademicCalendar.id, calendarId)),
          context.runtime.database
            .select()
            .from(CalendarRestriction)
            .where(eq(CalendarRestriction.academicCalendarId, calendarId)),
          context.runtime.database
            .select()
            .from(GeneratedCalendar)
            .where(eq(GeneratedCalendar.id, generatedCalendarId)),
        ]);
      assert.equal(remainingCalendars.length, 0);
      assert.equal(remainingRestrictions.length, 0);
      assert.equal(remainingSnapshots.length, 0);

      return { calendarId, generatedCalendarId };
    },
  };
}
