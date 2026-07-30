import assert from 'node:assert/strict';
import { and, eq } from 'drizzle-orm';
import { Event, PersonalEvent } from '../../../src/entities';
import {
  flowKey,
  type FlowKey,
  type OutputIntegrationStep,
} from '../framework/contracts';
import {
  expectObject,
  expectStatus,
  expectString,
  type ActorResolver,
} from './step-support';

export const PERSONAL_EVENT_CREATION_STEP_NAME = 'create a personal event';
export const PERSONAL_EVENT_DELETION_STEP_NAME = 'delete a personal event';

export type PersonalEventCreationPlan = {
  readonly userIdKey: FlowKey<string | { readonly userId: string }>;
  readonly eventName: string;
  readonly eventDate: string;
  readonly startTime: string;
  readonly endTime: string;
};

export type PersonalEventOutput = {
  readonly eventId: string;
  readonly eventName: string;
  readonly eventDate: string;
};

export function personalEventCreationStep<TPlan>(
  select: (plan: TPlan) => PersonalEventCreationPlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, PersonalEventOutput> {
  return {
    name: PERSONAL_EVENT_CREATION_STEP_NAME,
    outputKey: flowKey<PersonalEventOutput>('event.personal'),
    async run(context) {
      const plan = select(context.plan);
      const userInput = context.require(plan.userIdKey);
      const userId =
        typeof userInput === 'string' ? userInput : userInput.userId;
      const student = await actor(context);
      const response = await student.request.post('/events', {
        json: {
          eventName: plan.eventName,
          activityCode: 'PERS1',
          eventCriteria: {
            eventSource: 'personal',
            date: plan.eventDate,
            startTime: plan.startTime,
            endTime: plan.endTime,
          },
          isRecurring: false,
          validated: true,
        },
      });
      expectStatus(response, 201, 'create personal event');
      expectObject(response.body, 'create personal event');
      expectObject(response.body.event, 'created personal event');
      expectString(response.body.event.eventId, 'personal event ID');
      expectObject(
        response.body.event.eventCriteria,
        'created personal event criteria',
      );
      assert.equal(response.body.event.eventName, plan.eventName);
      assert.equal(response.body.event.eventCriteria.eventSource, 'personal');
      assert.equal(response.body.event.eventCriteria.date, plan.eventDate);
      const eventId = response.body.event.eventId;

      const fetched = await student.request.get(`/events/${eventId}`);
      expectStatus(fetched, 200, 'retrieve personal event');
      expectObject(fetched.body, 'retrieve personal event');
      expectObject(fetched.body.event, 'retrieved personal event');
      assert.equal(fetched.body.event.eventId, eventId);

      const [events, ownership] = await Promise.all([
        context.runtime.database
          .select()
          .from(Event)
          .where(eq(Event.eventID, eventId)),
        context.runtime.database
          .select()
          .from(PersonalEvent)
          .where(
            and(
              eq(PersonalEvent.eventID, eventId),
              eq(PersonalEvent.UserID, userId),
            ),
          ),
      ]);
      assert.equal(events.length, 1);
      assert.equal(ownership.length, 1);

      return {
        eventId,
        eventName: plan.eventName,
        eventDate: plan.eventDate,
      };
    },
  };
}

export type PersonalEventDeletionPlan = {
  readonly eventKey: FlowKey<PersonalEventOutput>;
};

export function personalEventDeletionStep<TPlan>(
  select: (plan: TPlan) => PersonalEventDeletionPlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, PersonalEventOutput> {
  return {
    name: PERSONAL_EVENT_DELETION_STEP_NAME,
    outputKey: flowKey<PersonalEventOutput>('event.personal.deleted'),
    async run(context) {
      const event = context.require(select(context.plan).eventKey);
      const student = await actor(context);
      const response = await student.request.delete(`/events/${event.eventId}`);
      expectStatus(response, 200, 'delete personal event');
      expectObject(response.body, 'delete personal event');
      assert.equal(response.body.success, true);
      assert.equal(response.body.eventName, event.eventName);

      const remaining = await context.runtime.database
        .select()
        .from(Event)
        .where(eq(Event.eventID, event.eventId));
      assert.equal(remaining.length, 0);
      return event;
    },
  };
}
