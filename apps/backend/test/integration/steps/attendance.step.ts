import assert from 'node:assert/strict';
import { and, eq } from 'drizzle-orm';
import { EventAttendance } from '../../../src/entities';
import {
  flowKey,
  type FlowKey,
  type OutputIntegrationStep,
} from '../framework/contracts';
import type { PersonalEventOutput } from './event.step';
import {
  expectObject,
  expectStatus,
  expectString,
  type ActorResolver,
} from './step-support';

export const ATTENDANCE_LIFECYCLE_STEP_NAME =
  'manage attendance for a scheduled event';

export type AttendanceLifecyclePlan = {
  readonly eventKey: FlowKey<PersonalEventOutput>;
  readonly userIdKey: FlowKey<string | { readonly userId: string }>;
};

export type AttendanceLifecycleOutput = {
  readonly attendanceId: string;
  readonly eventId: string;
  readonly finalState: 'NOT_ATTENDING';
};

export function attendanceLifecycleStep<TPlan>(
  select: (plan: TPlan) => AttendanceLifecyclePlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, AttendanceLifecycleOutput> {
  return {
    name: ATTENDANCE_LIFECYCLE_STEP_NAME,
    outputKey: flowKey<AttendanceLifecycleOutput>('attendance.lifecycle'),
    async run(context) {
      const plan = select(context.plan);
      const event = context.require(plan.eventKey);
      const userInput = context.require(plan.userIdKey);
      const userId =
        typeof userInput === 'string' ? userInput : userInput.userId;
      const student = await actor(context);

      const created = await student.request.post('/attendance', {
        json: {
          eventID: event.eventId,
          eventDate: event.eventDate,
          state: 'ATTENDING',
        },
      });
      expectStatus(created, 201, 'create attendance');
      expectObject(created.body, 'create attendance');
      expectString(created.body.AttendanceID, 'attendance ID');
      assert.equal(created.body.UserID, userId);
      assert.equal(created.body.eventID, event.eventId);
      assert.equal(created.body.state, 'ATTENDING');
      const attendanceId = created.body.AttendanceID;

      const fetched = await student.request.get(`/attendance/${attendanceId}`);
      expectStatus(fetched, 200, 'retrieve attendance');
      expectObject(fetched.body, 'retrieve attendance');
      assert.equal(fetched.body.AttendanceID, attendanceId);

      const listed = await student.request.get('/attendance');
      expectStatus(listed, 200, 'list attendance');
      expectObject(listed.body, 'list attendance');
      assert.ok(Array.isArray(listed.body.attendanceList));
      assert.ok(
        listed.body.attendanceList.some(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            (item as Record<string, unknown>).AttendanceID === attendanceId,
        ),
      );

      const updated = await student.request.patch(
        `/attendance/${attendanceId}`,
        {
          json: { state: 'NOT_ATTENDING' },
        },
      );
      expectStatus(updated, 200, 'update attendance');
      expectObject(updated.body, 'update attendance');
      assert.equal(updated.body.state, 'NOT_ATTENDING');

      const persisted = await context.runtime.database
        .select()
        .from(EventAttendance)
        .where(
          and(
            eq(EventAttendance.AttendanceID, attendanceId),
            eq(EventAttendance.UserID, userId),
          ),
        );
      assert.equal(persisted.length, 1);
      assert.equal(persisted[0].state, 'NOT_ATTENDING');

      const deleted = await student.request.delete(
        `/attendance/${attendanceId}`,
      );
      expectStatus(deleted, 200, 'delete attendance');
      expectObject(deleted.body, 'delete attendance');
      assert.equal(deleted.body.success, true);

      const remaining = await context.runtime.database
        .select()
        .from(EventAttendance)
        .where(eq(EventAttendance.AttendanceID, attendanceId));
      assert.equal(remaining.length, 0);

      return {
        attendanceId,
        eventId: event.eventId,
        finalState: 'NOT_ATTENDING',
      };
    },
  };
}
