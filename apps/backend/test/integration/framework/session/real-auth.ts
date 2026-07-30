import type { TestActor } from '../http-test-client';

export type RealAuthInput = {
  readonly email: string;
  readonly password: string;
  readonly name: string;
};

export type VerificationRequestResolver = (input: RealAuthInput) => Promise<{
  readonly method?: 'GET' | 'POST';
  readonly path: string;
  readonly body?: unknown;
}>;

export async function authenticateRealActor(
  actor: TestActor,
  input: RealAuthInput,
  resolveVerificationRequest: VerificationRequestResolver,
): Promise<TestActor> {
  const signUp = await actor.request.post<{
    user?: { id?: string; email?: string };
  }>('/auth/sign-up/email', { json: input });
  assertStatus(signUp.status, [200, 201], 'sign up');

  const verification = await resolveVerificationRequest(input);
  const verificationResponse =
    verification.method === 'POST'
      ? await actor.request.post(verification.path, {
          json: verification.body,
        })
      : await actor.request.get(verification.path);
  assertStatus(verificationResponse.status, [200, 201, 302], 'verification');

  const signIn = await actor.request.post<{
    user?: { id?: string; email?: string };
  }>('/auth/sign-in/email', {
    json: { email: input.email, password: input.password },
  });
  assertStatus(signIn.status, [200, 201], 'sign in');

  return actor.setSession({
    strategy: 'real-auth',
    userId: signIn.body.user?.id ?? signUp.body.user?.id,
    email: signIn.body.user?.email ?? input.email,
  });
}

function assertStatus(
  actual: number,
  expected: readonly number[],
  operation: string,
): void {
  if (!expected.includes(actual)) {
    throw new Error(
      `Real-auth ${operation} expected HTTP ${expected.join(' or ')}, received ${actual}`,
    );
  }
}
