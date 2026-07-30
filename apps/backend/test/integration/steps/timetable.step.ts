import assert from 'node:assert/strict';
import { and, eq } from 'drizzle-orm';
import {
  EventsToTimetables,
  Timetable,
  UserTimetable,
} from '../../../src/entities';
import {
  flowKey,
  type FlowKey,
  type IntegrationStep,
  type OutputIntegrationStep,
} from '../framework/contracts';
import type { AuthenticationStepOutput } from './authentication.step';
import {
  expectObject,
  expectStatus,
  expectString,
  sorted,
  type ActorResolver,
} from './step-support';

export const TIMETABLE_STEP_NAME = 'create and retrieve timetable';

export type TimetableStepPlan = {
  readonly selectedEventIdsKey: FlowKey<
    readonly string[] | { readonly selectedEventIds: readonly string[] }
  >;
  readonly timetableName: string;
  readonly userId?: string;
  readonly userIdKey?: FlowKey<
    string | { readonly userId: string } | AuthenticationStepOutput
  >;
};

export type TimetableStepOutput = {
  readonly timetable: {
    readonly timetableID: string;
    readonly timetableName: string | null;
  };
  readonly UserTimetableID: string;
  readonly eventIds: readonly string[];
};

export function timetableCreationStep<TPlan>(
  select: (plan: TPlan) => TimetableStepPlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, TimetableStepOutput> {
  return {
    name: TIMETABLE_STEP_NAME,
    outputKey: flowKey<TimetableStepOutput>('timetable.primary'),
    async run(context) {
      const plan = select(context.plan);
      const selectedInput = context.require(plan.selectedEventIdsKey);
      const eventIds =
        'selectedEventIds' in selectedInput
          ? selectedInput.selectedEventIds
          : selectedInput;
      const userId = resolveUserId(context, plan);
      const student = await actor(context);
      const response = await student.request.post('/timetables', {
        json: {
          timetableName: plan.timetableName,
          eventIds,
        },
      });
      expectStatus(response, 201, 'create timetable');
      expectObject(response.body, 'create timetable');
      expectObject(response.body.timetable, 'created timetable');
      expectString(
        response.body.timetable.timetableID,
        'timetable.timetableID',
      );
      expectString(response.body.UserTimetableID, 'UserTimetableID');
      assert.deepEqual(
        sorted(response.body.eventIds as string[]),
        sorted(eventIds),
      );

      const output = response.body as unknown as TimetableStepOutput;
      const fetched = await student.request.get(
        `/timetables/${output.timetable.timetableID}`,
      );
      expectStatus(fetched, 200, 'retrieve timetable');
      assert.deepEqual(fetched.body, response.body);

      const [timetables, ownership, relationships] = await Promise.all([
        context.runtime.database
          .select()
          .from(Timetable)
          .where(eq(Timetable.timetableID, output.timetable.timetableID)),
        context.runtime.database
          .select()
          .from(UserTimetable)
          .where(
            and(
              eq(UserTimetable.UserID, userId),
              eq(UserTimetable.TimetableID, output.timetable.timetableID),
            ),
          ),
        context.runtime.database
          .select()
          .from(EventsToTimetables)
          .where(
            eq(EventsToTimetables.timetableID, output.timetable.timetableID),
          ),
      ]);
      assert.equal(timetables.length, 1);
      assert.equal(ownership.length, 1);
      assert.deepEqual(
        sorted(relationships.map((row) => row.eventID)),
        sorted(eventIds),
      );
      return output;
    },
  };
}

function resolveUserId<TPlan>(
  context: Parameters<IntegrationStep<TPlan>['run']>[0],
  plan: TimetableStepPlan,
): string {
  if (plan.userId) return plan.userId;
  if (!plan.userIdKey) {
    throw new Error('Timetable creation requires userId or userIdKey');
  }
  const input = context.require(plan.userIdKey);
  return typeof input === 'string' ? input : input.userId;
}
