import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import {
  EventsToTimetables,
  Timetable,
  UserTimetable,
} from '../../../src/entities';
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

export const TIMETABLE_LIFECYCLE_STEP_NAME = 'manage a saved timetable';

export type TimetableLifecyclePlan = {
  readonly eventKey: FlowKey<PersonalEventOutput>;
  readonly initialName: string;
  readonly updatedName: string;
};

export type TimetableLifecycleOutput = {
  readonly timetableId: string;
  readonly eventId: string;
};

export function timetableLifecycleStep<TPlan>(
  select: (plan: TPlan) => TimetableLifecyclePlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, TimetableLifecycleOutput> {
  return {
    name: TIMETABLE_LIFECYCLE_STEP_NAME,
    outputKey: flowKey<TimetableLifecycleOutput>('timetable.lifecycle'),
    async run(context) {
      const plan = select(context.plan);
      const event = context.require(plan.eventKey);
      const student = await actor(context);
      const created = await student.request.post('/timetables', {
        json: {
          timetableName: plan.initialName,
          eventIds: [event.eventId],
        },
      });
      expectStatus(created, 201, 'create saved timetable');
      expectObject(created.body, 'create saved timetable');
      expectObject(created.body.timetable, 'created saved timetable');
      expectString(created.body.timetable.timetableID, 'saved timetable ID');
      const timetableId = created.body.timetable.timetableID;
      assert.equal(created.body.timetable.timetableName, plan.initialName);
      assert.deepEqual(created.body.eventIds, [event.eventId]);

      const listed = await student.request.get('/timetables');
      expectStatus(listed, 200, 'list saved timetables');
      expectObject(listed.body, 'list saved timetables');
      assert.ok(Array.isArray(listed.body.timetables));
      assert.ok(
        listed.body.timetables.some(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            (item as { timetable?: { timetableID?: unknown } }).timetable
              ?.timetableID === timetableId,
        ),
      );

      const updated = await student.request.patch(
        `/timetables/${timetableId}`,
        {
          json: {
            timetableName: plan.updatedName,
            removeEventIds: [event.eventId],
          },
        },
      );
      expectStatus(updated, 200, 'update saved timetable');
      expectObject(updated.body, 'update saved timetable');
      expectObject(updated.body.timetable, 'updated saved timetable');
      assert.equal(updated.body.timetable.timetableName, plan.updatedName);
      assert.equal('eventIds' in updated.body, false);

      const relationships = await context.runtime.database
        .select()
        .from(EventsToTimetables)
        .where(eq(EventsToTimetables.timetableID, timetableId));
      assert.equal(relationships.length, 0);

      const deleted = await student.request.delete(
        `/timetables/${timetableId}`,
      );
      expectStatus(deleted, 200, 'delete saved timetable');
      expectObject(deleted.body, 'delete saved timetable');
      assert.equal(deleted.body.success, true);

      const [timetables, ownership] = await Promise.all([
        context.runtime.database
          .select()
          .from(Timetable)
          .where(eq(Timetable.timetableID, timetableId)),
        context.runtime.database
          .select()
          .from(UserTimetable)
          .where(eq(UserTimetable.TimetableID, timetableId)),
      ]);
      assert.equal(timetables.length, 0);
      assert.equal(ownership.length, 0);

      return { timetableId, eventId: event.eventId };
    },
  };
}
