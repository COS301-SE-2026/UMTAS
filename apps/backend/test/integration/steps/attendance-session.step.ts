import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { EventSource } from '../../../src/Events/dto/event.types';
import { waitForVerificationToken } from '../framework/mailhog';
import { authenticateRealActor } from '../framework/session/real-auth';
import {
  AttendanceSession,
  Course,
  Event,
  GroupModules,
  ModuleEnrollment,
  ModuleGrouping,
  modules,
  SessionAttendance,
  UniversityEvent,
  UniversityRole,
} from '../../../src/entities';
import { flowKey, type OutputIntegrationStep } from '../framework/contracts';
import type { AuthenticationStepOutput } from './authentication.step';
import type { UniversityOutput } from './university.step';
import { expectObject, expectStatus, expectString } from './step-support';
import type { ActorResolver } from './step-support';
import type { FlowKey } from '../framework/contracts';

export type AttendanceSessionLifecyclePlan = {
  readonly authenticationKey: FlowKey<AuthenticationStepOutput>;
  readonly universityKey: FlowKey<UniversityOutput>;
};

export type AttendanceSessionLifecycleOutput = {
  readonly sessionId: string;
  readonly finalState: 'CLOSED';
};

export const ATTENDANCE_SESSION_LIFECYCLE_STEP_NAME =
  'create, open, record, and close verified attendance';

export function attendanceSessionLifecycleStep<TPlan>(
  select: (plan: TPlan) => AttendanceSessionLifecyclePlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, AttendanceSessionLifecycleOutput> {
  return {
    name: ATTENDANCE_SESSION_LIFECYCLE_STEP_NAME,
    outputKey: flowKey<AttendanceSessionLifecycleOutput>(
      'attendance.session.lifecycle',
    ),
    async run(context) {
      const plan = select(context.plan);
      const operator = context.require(plan.authenticationKey);
      const university = context.require(plan.universityKey);
      const db = context.runtime.database;
      const moduleId = randomUUID();
      const eventId = randomUUID();
      const groupingId = randomUUID();
      const operatorActor = await actor(context);

      await db.insert(UniversityRole).values({
        UserID: operator.userId,
        UniversityID: university.UniversityID,
        role: 'UNIVERSITY_ADMIN',
      });
      const selected = await operatorActor.request.post(
        '/auth/select-university',
        {
          json: { uniId: university.UniversityID },
        },
      );
      expectStatus(selected, [200, 201], 'select operator university');
      expectObject(selected.body, 'select operator university');
      assert.equal(selected.body.uniRole, 'uni_admin');

      await db.insert(ModuleGrouping).values({ GroupID: groupingId });
      await db.insert(modules).values({
        moduleID: moduleId,
        moduleCode: `ATT${Date.now()}`.slice(0, 15),
        moduleName: 'Verified attendance integration',
      });
      await db.insert(GroupModules).values({
        GroupID: groupingId,
        ModuleID: moduleId,
      });
      await db.insert(Course).values({
        UniversityID: university.UniversityID,
        GroupID: groupingId,
        CourseName: 'Attendance integration course',
      });
      await db.insert(Event).values({
        eventID: eventId,
        eventName: 'Attendance test event',
        eventCriteria: {
          eventSource: EventSource.UNIVERSITY,
          moduleId,
          startTime: '09:00',
          endTime: '10:00',
        },
      });
      await db.insert(UniversityEvent).values({
        eventID: eventId,
        moduleID: moduleId,
      });

      const now = Date.now();
      const date = (offset: number) => new Date(now + offset).toISOString();
      const created = await operatorActor.request.post('/attendance/sessions', {
        json: {
          eventID: eventId,
          scheduledStartAt: date(-3_600_000),
          scheduledEndAt: date(3_600_000),
          captureOpensAt: date(-60_000),
          captureClosesAt: date(600_000),
          captureMode: 'AGGREGATE',
        },
      });
      expectStatus(created, 201, 'create verified attendance session');
      expectObject(created.body, 'create verified attendance session');
      expectString(created.body.SessionID, 'attendance session ID');
      const sessionId = created.body.SessionID;

      const opened = await operatorActor.request.post(
        `/attendance/sessions/${sessionId}/open`,
      );
      expectStatus(opened, 201, 'open attendance session');
      expectObject(opened.body, 'open attendance session');
      assert.equal(opened.body.state, 'OPEN');

      const count = await operatorActor.request.put(
        `/attendance/sessions/${sessionId}/attendance/count`,
        { json: { guestCount: 7 } },
      );
      expectStatus(count, 200, 'set manual guest count');
      expectObject(count.body, 'set manual guest count');
      assert.equal(count.body.guestCount, 7);

      const fetched = await operatorActor.request.get(
        `/attendance/sessions/${sessionId}`,
      );
      expectStatus(fetched, 200, 'read attendance totals');
      expectObject(fetched.body, 'read attendance totals');
      assert.equal(fetched.body.attendedCount, 7);

      const identifiedCreated = await operatorActor.request.post(
        '/attendance/sessions',
        {
          json: {
            eventID: eventId,
            scheduledStartAt: date(-7_200_000),
            scheduledEndAt: date(-3_600_000),
            captureOpensAt: date(-60_000),
            captureClosesAt: date(600_000),
            captureMode: 'IDENTIFIED',
          },
        },
      );
      expectStatus(identifiedCreated, 201, 'create identified session');
      expectObject(identifiedCreated.body, 'create identified session');
      expectString(identifiedCreated.body.SessionID, 'identified session ID');
      const identifiedSessionId = identifiedCreated.body.SessionID;
      await db.insert(ModuleEnrollment).values({
        ModuleID: moduleId,
        UserID: operator.userId,
      });
      const identifiedOpened = await operatorActor.request.post(
        `/attendance/sessions/${identifiedSessionId}/open`,
      );
      expectStatus(identifiedOpened, 201, 'open identified session');
      const recorded = await operatorActor.request.post(
        `/attendance/sessions/${identifiedSessionId}/records`,
        { json: { UserID: operator.userId } },
      );
      expectStatus(recorded, 201, 'record identified attendance');
      expectObject(recorded.body, 'record identified attendance');
      assert.equal(recorded.body.status, 'RECORDED');
      const repeated = await operatorActor.request.post(
        `/attendance/sessions/${identifiedSessionId}/records`,
        { json: { UserID: operator.userId } },
      );
      expectStatus(repeated, 201, 'repeat identified attendance');
      expectObject(repeated.body, 'repeat identified attendance');
      assert.equal(repeated.body.status, 'ALREADY_RECORDED');
      const identifiedSummary = await operatorActor.request.get(
        `/attendance/sessions/${identifiedSessionId}`,
      );
      expectStatus(identifiedSummary, 200, 'read identified totals');
      expectObject(identifiedSummary.body, 'read identified totals');
      assert.equal(identifiedSummary.body.identifiedCount, 1);
      assert.equal(identifiedSummary.body.attendedCount, 1);
      assert.equal('attendanceList' in identifiedSummary.body, false);
      assert.equal('attendance' in identifiedSummary.body, false);
      assert.equal('UserID' in identifiedSummary.body, false);

      const ownHistory = await operatorActor.request.get(
        '/attendance/me/verified-history',
      );
      expectStatus(ownHistory, 200, 'read own verified history');
      expectObject(ownHistory.body, 'read own verified history');
      assert.ok(Array.isArray(ownHistory.body.attendanceList));
      assert.equal(ownHistory.body.attendanceList.length, 1);
      assert.equal(
        (ownHistory.body.attendanceList[0] as Record<string, unknown>).UserID,
        operator.userId,
      );

      const outsider = context.actor('attendance-outsider');
      const outsiderEmail = `attendance-outsider-${randomUUID()}@test.umtas.local`;
      await authenticateRealActor(
        outsider,
        {
          email: outsiderEmail,
          password: 'Attendance!Outsider2026',
          name: 'Attendance Outsider',
        },
        async () => ({
          path: `/auth/verify-email?token=${encodeURIComponent(
            await waitForVerificationToken(outsiderEmail),
          )}`,
        }),
      );
      const outsiderSession = await outsider.request.get('/auth/get-session');
      expectStatus(outsiderSession, 200, 'read outsider session');
      expectObject(outsiderSession.body, 'read outsider session');
      const outsiderUser = outsiderSession.body.user as Record<string, unknown>;
      expectString(outsiderUser.id, 'outsider user ID');
      await db.insert(UniversityRole).values({
        UserID: outsiderUser.id,
        UniversityID: university.UniversityID,
        role: 'STUDENT',
      });
      const outsiderSelected = await outsider.request.post(
        '/auth/select-university',
        {
          json: { uniId: university.UniversityID },
        },
      );
      expectStatus(outsiderSelected, [200, 201], 'select outsider university');
      const outsiderHistory = await outsider.request.get(
        '/attendance/me/verified-history',
      );
      expectStatus(outsiderHistory, 200, 'read outsider verified history');
      expectObject(outsiderHistory.body, 'read outsider verified history');
      assert.deepEqual(outsiderHistory.body.attendanceList, []);
      const outsiderSummary = await outsider.request.get(
        `/attendance/sessions/${identifiedSessionId}`,
      );
      expectStatus(
        outsiderSummary,
        403,
        'reject unenrolled student session read',
      );

      await db
        .update(UniversityRole)
        .set({ role: 'LECTURER' })
        .where(
          and(
            eq(UniversityRole.UserID, outsiderUser.id),
            eq(UniversityRole.UniversityID, university.UniversityID),
          ),
        );
      const lecturerSelected = await outsider.request.post(
        '/auth/select-university',
        {
          json: { uniId: university.UniversityID },
        },
      );
      expectStatus(
        lecturerSelected,
        [200, 201],
        'select outsider lecturer role',
      );
      const unrelatedOpen = await outsider.request.post(
        `/attendance/sessions/${identifiedSessionId}/open`,
      );
      expectStatus(unrelatedOpen, 403, 'reject unrelated lecturer operation');

      const closed = await operatorActor.request.post(
        `/attendance/sessions/${sessionId}/close`,
      );
      expectStatus(closed, 201, 'close attendance session');
      expectObject(closed.body, 'close attendance session');
      assert.equal(closed.body.state, 'CLOSED');

      const afterClose = await operatorActor.request.put(
        `/attendance/sessions/${sessionId}/attendance/count`,
        { json: { guestCount: 8 } },
      );
      expectStatus(afterClose, 400, 'reject count change after close');

      const persisted = await db
        .select()
        .from(AttendanceSession)
        .where(eq(AttendanceSession.SessionID, sessionId));
      assert.equal(persisted.length, 1);
      assert.equal(persisted[0].state, 'CLOSED');
      const rows = await db
        .select()
        .from(SessionAttendance)
        .where(eq(SessionAttendance.SessionID, sessionId));
      assert.equal(rows.length, 1);
      assert.equal(rows[0].guestCount, 7);

      return { sessionId, finalState: 'CLOSED' };
    },
  };
}
