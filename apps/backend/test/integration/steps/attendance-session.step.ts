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
import { localDateAt } from '../../../src/Attendance/attendance-occurrence';
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
  readonly finalState: 'PERSISTED';
};

export const ATTENDANCE_SESSION_LIFECYCLE_STEP_NAME =
  'create, record, and correct verified attendance';

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
          json: {
            uniId: university.UniversityID,
          },
        },
      );

      expectStatus(selected, [200, 201], 'select operator university');
      expectObject(selected.body, 'select operator university');

      assert.equal(selected.body.uniRole, 'uni_admin');

      await db.insert(ModuleGrouping).values({
        GroupID: groupingId,
      });

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
        validated: true,
        isRecurring: false,
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
        },
      });

      expectStatus(created, 201, 'create verified attendance session');
      expectObject(created.body, 'create verified attendance session');
      expectString(created.body.SessionID, 'attendance session ID');

      const sessionId = created.body.SessionID;

      const count = await operatorActor.request.put(
        `/attendance/sessions/${sessionId}/attendance/count`,
        {
          json: {
            guestCount: 7,
            captureMethod: 'MANUAL',
          },
        },
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

      const currentInstant = new Date();

      const attendanceTimeZone =
        process.env.ATTENDANCE_TIME_ZONE ?? 'Africa/Johannesburg';

      const localDate = localDateAt(currentInstant, attendanceTimeZone);

      const formatLocalTime = (value: Date) =>
        new Intl.DateTimeFormat('en-GB', {
          timeZone: attendanceTimeZone,
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        }).format(value);

      await db
        .update(Event)
        .set({
          eventCriteria: {
            eventSource: EventSource.UNIVERSITY,
            moduleId,
            date: localDate,
            startTime: formatLocalTime(
              new Date(currentInstant.getTime() - 5 * 60_000),
            ),
            endTime: formatLocalTime(
              new Date(currentInstant.getTime() + 20 * 60_000),
            ),
          },
        })
        .where(eq(Event.eventID, eventId));

      const student = context.actor('attendance-student');

      const studentEmail = `attendance-student-${randomUUID()}@test.umtas.local`;

      await authenticateRealActor(
        student,
        {
          email: studentEmail,
          password: 'Attendance!Student2026',
          name: 'Attendance Student',
        },
        async () => ({
          path: `/auth/verify-email?token=${encodeURIComponent(
            await waitForVerificationToken(studentEmail),
          )}`,
        }),
      );

      const studentSession = await student.request.get('/auth/get-session');

      expectStatus(studentSession, 200, 'read attendance student session');

      expectObject(studentSession.body, 'read attendance student session');

      const studentUser = studentSession.body.user as Record<string, unknown>;

      expectString(studentUser.id, 'attendance student ID');

      await db.insert(UniversityRole).values({
        UserID: studentUser.id,
        UniversityID: university.UniversityID,
        role: 'STUDENT',
      });

      const studentSelected = await student.request.post(
        '/auth/select-university',
        {
          json: {
            uniId: university.UniversityID,
          },
        },
      );

      expectStatus(studentSelected, [200, 201], 'select student university');

      await db.insert(ModuleEnrollment).values({
        ModuleID: moduleId,
        UserID: studentUser.id,
      });

      const preparedTag = await operatorActor.request.post(
        '/attendance/nfc-tags/registration',
      );

      expectStatus(preparedTag, 201, 'prepare NFC sticker registration');

      expectObject(preparedTag.body, 'prepare NFC sticker registration');

      expectString(preparedTag.body.tagId, 'prepared NFC tag ID');

      expectString(preparedTag.body.token, 'prepared NFC token');

      expectString(preparedTag.body.activationTicket, 'activation ticket');

      const firstTagId = preparedTag.body.tagId;
      const firstToken = preparedTag.body.token;

      const confirmedTag = await operatorActor.request.post(
        '/attendance/nfc-tags/registration/confirm',
        {
          json: {
            activationTicket: preparedTag.body.activationTicket,
          },
        },
      );

      expectStatus(confirmedTag, 201, 'confirm NFC sticker registration');

      expectObject(confirmedTag.body, 'confirm NFC sticker registration');

      assert.equal(confirmedTag.body.tagId, firstTagId);

      const registeredTagStatus = await operatorActor.request.get(
        '/attendance/nfc-tags/me',
      );

      expectStatus(registeredTagStatus, 200, 'read registered NFC sticker');

      expectObject(registeredTagStatus.body, 'read registered NFC sticker');

      const registeredTag = registeredTagStatus.body.tag as Record<
        string,
        unknown
      >;

      assert.equal(registeredTag.tagId, firstTagId);

      assert.equal('token' in registeredTag, false);

      assert.equal('tokenHash' in registeredTag, false);

      const operatorSlots = await operatorActor.request.get(
        `/attendance/operator/slots?date=${localDate}`,
      );

      expectStatus(operatorSlots, 200, 'read current operator slots');

      expectObject(operatorSlots.body, 'read current operator slots');

      assert.ok(Array.isArray(operatorSlots.body.slotList));

      const currentSlot = (
        operatorSlots.body.slotList as Record<string, unknown>[]
      ).find((slot) => slot.eventID === eventId);

      assert.ok(currentSlot, 'current attendance event should appear in slots');

      assert.equal(
        currentSlot.state,
        'AVAILABLE',
        'current attendance event should be available',
      );

      const firstCheckIn = await student.request.post('/attendance/records', {
        json: {
          captureMethod: 'NFC',
          tagId: firstTagId,
          token: firstToken,
        },
      });

      expectStatus(firstCheckIn, 201, 'record first NFC check-in');

      expectObject(firstCheckIn.body, 'record first NFC check-in');

      assert.equal(firstCheckIn.body.status, 'RECORDED');

      expectString(firstCheckIn.body.sessionId, 'NFC-created session ID');

      const nfcSessionId = firstCheckIn.body.sessionId;

      const repeatedCheckIn = await student.request.post(
        '/attendance/records',
        {
          json: {
            captureMethod: 'NFC',
            tagId: firstTagId,
            token: firstToken,
          },
        },
      );

      expectStatus(repeatedCheckIn, 201, 'repeat NFC check-in');

      expectObject(repeatedCheckIn.body, 'repeat NFC check-in');

      assert.equal(repeatedCheckIn.body.status, 'ALREADY_RECORDED');

      const slotsAfterCheckIn = await operatorActor.request.get(
        `/attendance/operator/slots?date=${localDate}`,
      );

      expectStatus(slotsAfterCheckIn, 200, 'read NFC attendance slot totals');

      expectObject(slotsAfterCheckIn.body, 'read NFC attendance slot totals');

      const nfcSlot = (
        slotsAfterCheckIn.body.slotList as Record<string, unknown>[]
      ).find((slot) => slot.eventID === eventId);

      assert.ok(nfcSlot);

      assert.equal(nfcSlot.attendanceCount, 1);

      const createdByNfc = await db
        .select()
        .from(AttendanceSession)
        .where(eq(AttendanceSession.SessionID, nfcSessionId));

      assert.equal(createdByNfc.length, 1);

      const nfcRows = await db
        .select()
        .from(SessionAttendance)
        .where(eq(SessionAttendance.SessionID, nfcSessionId));

      assert.equal(nfcRows.length, 1);

      assert.equal(nfcRows[0]?.captureMethod, 'NFC');

      const replacement = await operatorActor.request.post(
        '/attendance/nfc-tags/registration',
      );

      expectStatus(replacement, 201, 'prepare replacement NFC sticker');

      expectObject(replacement.body, 'prepare replacement NFC sticker');

      const replacementTagId = replacement.body.tagId;

      const replacementToken = replacement.body.token;

      const replacementConfirmed = await operatorActor.request.post(
        '/attendance/nfc-tags/registration/confirm',
        {
          json: {
            activationTicket: replacement.body.activationTicket,
          },
        },
      );

      expectStatus(replacementConfirmed, 201, 'activate replacement sticker');

      const replacementStatus = await operatorActor.request.get(
        '/attendance/nfc-tags/me',
      );

      expectStatus(replacementStatus, 200, 'read replacement NFC sticker');

      expectObject(replacementStatus.body, 'read replacement NFC sticker');

      const registeredReplacement = replacementStatus.body.tag as Record<
        string,
        unknown
      >;

      assert.equal(registeredReplacement.tagId, replacementTagId);

      const invalidatedOldTag = await student.request.post(
        '/attendance/records',
        {
          json: {
            captureMethod: 'NFC',
            tagId: firstTagId,
            token: firstToken,
          },
        },
      );

      expectStatus(invalidatedOldTag, 201, 'reject replaced sticker');

      expectObject(invalidatedOldTag.body, 'reject replaced sticker');

      assert.equal(invalidatedOldTag.body.status, 'INVALID_TAG');

      const replacementCheckIn = await student.request.post(
        '/attendance/records',
        {
          json: {
            captureMethod: 'NFC',
            tagId: replacementTagId,
            token: replacementToken,
          },
        },
      );

      expectStatus(replacementCheckIn, 201, 'accept replacement sticker');

      expectObject(replacementCheckIn.body, 'accept replacement sticker');

      assert.equal(replacementCheckIn.body.status, 'ALREADY_RECORDED');

      const guest = context.actor('attendance-guest');

      const guestCheckIn = await guest.request.post('/attendance/records', {
        json: {
          captureMethod: 'NFC',
          tagId: replacementTagId,
          token: replacementToken,
        },
      });

      expectStatus(guestCheckIn, 201, 'record anonymous NFC attendance');

      expectObject(guestCheckIn.body, 'record anonymous NFC attendance');

      assert.equal(guestCheckIn.body.status, 'RECORDED');

      const recorded = await operatorActor.request.post(
        `/attendance/sessions/${identifiedSessionId}/records`,
        {
          json: {
            UserID: operator.userId,
            captureMethod: 'MANUAL',
          },
        },
      );

      expectStatus(recorded, 201, 'record identified attendance');

      expectObject(recorded.body, 'record identified attendance');

      assert.equal(recorded.body.status, 'RECORDED');

      const repeated = await operatorActor.request.post(
        `/attendance/sessions/${identifiedSessionId}/records`,
        {
          json: {
            UserID: operator.userId,
            captureMethod: 'MANUAL',
          },
        },
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
          json: {
            uniId: university.UniversityID,
          },
        },
      );

      expectStatus(outsiderSelected, [200, 201], 'select outsider university');

      const unenrolledCheckIn = await outsider.request.post(
        '/attendance/records',
        {
          json: {
            captureMethod: 'NFC',
            tagId: replacementTagId,
            token: replacementToken,
          },
        },
      );

      expectStatus(unenrolledCheckIn, 403, 'reject unenrolled NFC check-in');

      expectObject(unenrolledCheckIn.body, 'reject unenrolled NFC check-in');

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
        .set({
          role: 'LECTURER',
        })
        .where(
          and(
            eq(UniversityRole.UserID, outsiderUser.id),
            eq(UniversityRole.UniversityID, university.UniversityID),
          ),
        );

      const lecturerSelected = await outsider.request.post(
        '/auth/select-university',
        {
          json: {
            uniId: university.UniversityID,
          },
        },
      );

      expectStatus(
        lecturerSelected,
        [200, 201],
        'select outsider lecturer role',
      );

      const unrelatedUpdate = await outsider.request.patch(
        `/attendance/sessions/${identifiedSessionId}`,
        {
          json: {
            scheduledEndAt: date(-3_000_000),
          },
        },
      );

      expectStatus(unrelatedUpdate, 403, 'reject unrelated lecturer operation');

      const corrected = await operatorActor.request.patch(
        `/attendance/sessions/${sessionId}`,
        {
          json: {
            scheduledEndAt: date(4_000_000),
          },
        },
      );

      expectStatus(corrected, 200, 'correct attendance session');

      expectObject(corrected.body, 'correct attendance session');

      assert.equal(corrected.body.scheduledEndAt, date(4_000_000));

      const listed = await operatorActor.request.get('/attendance/sessions');

      expectStatus(listed, 200, 'list attendance sessions');

      expectObject(listed.body, 'list attendance sessions');

      assert.ok(Array.isArray(listed.body.sessionList));

      const persisted = await db
        .select()
        .from(AttendanceSession)
        .where(eq(AttendanceSession.SessionID, sessionId));

      assert.equal(persisted.length, 1);

      const rows = await db
        .select()
        .from(SessionAttendance)
        .where(eq(SessionAttendance.SessionID, sessionId));

      assert.equal(rows.length, 1);

      assert.equal(rows[0].guestCount, 7);

      return {
        sessionId,
        finalState: 'PERSISTED',
      };
    },
  };
}
