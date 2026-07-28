import assert from 'node:assert/strict';
import { flowKey, type OutputIntegrationStep } from '../framework/contracts';
import type { SessionDescriptor } from '../framework/http-test-client';
import {
  authenticateRealActor,
  type VerificationRequestResolver,
} from '../framework/session/real-auth';
import { expectObject, expectStatus, expectString } from './step-support';

export const AUTHENTICATION_STEP_NAME = 'authenticate student';

export type AuthenticationStepPlan = {
  readonly email: string;
  readonly password: string;
  readonly name: string;
  readonly resolveVerificationRequest: VerificationRequestResolver;
};

export type AuthenticationStepOutput = {
  readonly actorName: string;
  readonly userId: string;
  readonly email: string;
  readonly session: SessionDescriptor & { readonly strategy: 'real-auth' };
};

export function authenticationStep<TPlan>(
  select: (plan: TPlan) => AuthenticationStepPlan,
): OutputIntegrationStep<TPlan, AuthenticationStepOutput> {
  return {
    name: AUTHENTICATION_STEP_NAME,
    outputKey: flowKey<AuthenticationStepOutput>('actor.student'),
    async run(context) {
      const plan = select(context.plan);
      const actor = context.actor('student');
      await authenticateRealActor(actor, plan, plan.resolveVerificationRequest);

      const response = await actor.request.get('/api/auth/get-session');
      expectStatus(response, 200, 'fetch authenticated session');
      expectObject(response.body, 'fetch authenticated session');
      const user =
        response.body.user && typeof response.body.user === 'object'
          ? (response.body.user as Record<string, unknown>)
          : response.body.session &&
              typeof response.body.session === 'object' &&
              'user' in response.body.session &&
              response.body.session.user &&
              typeof response.body.session.user === 'object'
            ? (response.body.session.user as Record<string, unknown>)
            : undefined;
      assert.ok(
        user,
        `Authenticated session response must contain a user: ${JSON.stringify(response.body)}`,
      );
      expectString(user.id, 'session.user.id');
      assert.equal(user.email, plan.email);

      const descriptor = actor.session();
      assert.equal(descriptor.strategy, 'real-auth');
      return {
        actorName: actor.name,
        userId: user.id,
        email: plan.email,
        session: descriptor,
      };
    },
  };
}
