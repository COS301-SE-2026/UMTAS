import assert from 'node:assert/strict';
import { and, eq } from 'drizzle-orm';
import { ModuleEnrollment } from '../../../src/entities';
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
  sorted,
  type ActorResolver,
} from './step-support';

export const MODULE_ENROLLMENT_STEP_NAME = 'enroll in module';

export type EnrollableModule = {
  readonly moduleID: string;
  readonly moduleCode: string;
};

export type ModuleEnrollmentPlan = {
  readonly moduleKey: FlowKey<
    EnrollableModule | { readonly module: EnrollableModule }
  >;
  readonly expectedEventIdsKey: FlowKey<
    readonly string[] | { readonly eventIds: readonly string[] }
  >;
  readonly userId?: string;
  readonly userIdKey?: FlowKey<
    string | { readonly userId: string } | AuthenticationStepOutput
  >;
};

export type ModuleEnrollmentOutput = {
  readonly enrollment: {
    readonly UserID: string;
    readonly moduleID: string;
    readonly message?: string;
  };
  readonly module: EnrollableModule;
  readonly eligibleEventIds: readonly string[];
};

export function moduleEnrollmentStep<TPlan>(
  select: (plan: TPlan) => ModuleEnrollmentPlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, ModuleEnrollmentOutput> {
  return {
    name: MODULE_ENROLLMENT_STEP_NAME,
    outputKey: flowKey<ModuleEnrollmentOutput>('enrollment.primary'),
    async run(context) {
      const plan = select(context.plan);
      const moduleInput = context.require(plan.moduleKey);
      const module = 'module' in moduleInput ? moduleInput.module : moduleInput;
      const eventIdsInput = context.require(plan.expectedEventIdsKey);
      const expectedEventIds =
        'eventIds' in eventIdsInput ? eventIdsInput.eventIds : eventIdsInput;
      const userId = resolveUserId(context, plan);
      const student = await actor(context);

      const response = await student.request.get(
        `/modules/enroll/${module.moduleID}`,
      );
      expectStatus(response, 200, 'enroll in module');
      expectObject(response.body, 'enroll in module');
      assert.equal(response.body.UserID, userId);
      assert.equal(response.body.moduleID, module.moduleID);
      assert.match(String(response.body.message), /Successfully enrolled/i);

      const modulesResponse = await student.request.get(
        '/modules?userEnrollment=true',
      );
      expectStatus(modulesResponse, 200, 'retrieve enrolled modules');
      expectObject(modulesResponse.body, 'retrieve enrolled modules');
      assert.ok(Array.isArray(modulesResponse.body.modules));
      assert.ok(
        modulesResponse.body.modules.some(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            (item as Record<string, unknown>).moduleID === module.moduleID,
        ),
      );

      const eventsResponse = await student.request.get('/events');
      expectStatus(eventsResponse, 200, 'retrieve eligible events');
      expectObject(eventsResponse.body, 'retrieve eligible events');
      assert.ok(Array.isArray(eventsResponse.body.events));
      const eligibleEventIds = eventsResponse.body.events.map((item) => {
        expectObject(item, 'eligible event');
        assert.equal(typeof item.eventId, 'string');
        return item.eventId as string;
      });
      assert.deepEqual(sorted(eligibleEventIds), sorted(expectedEventIds));

      const persisted = await context.runtime.database
        .select()
        .from(ModuleEnrollment)
        .where(
          and(
            eq(ModuleEnrollment.UserID, userId),
            eq(ModuleEnrollment.ModuleID, module.moduleID),
          ),
        );
      assert.equal(persisted.length, 1);

      return {
        enrollment: response.body as ModuleEnrollmentOutput['enrollment'],
        module,
        eligibleEventIds,
      };
    },
  };
}

function resolveUserId<TPlan>(
  context: Parameters<IntegrationStep<TPlan>['run']>[0],
  plan: ModuleEnrollmentPlan,
): string {
  if (plan.userId) return plan.userId;
  if (!plan.userIdKey) {
    throw new Error('Module enrollment requires userId or userIdKey');
  }
  const input = context.require(plan.userIdKey);
  return typeof input === 'string' ? input : input.userId;
}
