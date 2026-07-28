import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import type { SessionData } from '../../../src/auth/session.decorator';
import { UniversityRole } from '../../../src/entities';
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

export type UniversityOutput = {
  readonly UniversityID: string;
  readonly UniversityName: string;
};

export const UNIVERSITY_SELECTION_STEP_NAME = 'apply for and select university';

export type UniversitySelectionPlan = {
  readonly universityKey: FlowKey<UniversityOutput>;
};

export type UniversitySelectionOutput = {
  readonly actorName: string;
  readonly university: UniversityOutput;
  readonly role: typeof UniversityRole.$inferSelect;
  readonly selectedSession: SessionData;
};

export function studentUniversitySelectionStep<TPlan>(
  select: (plan: TPlan) => UniversitySelectionPlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, UniversitySelectionOutput> {
  return {
    name: UNIVERSITY_SELECTION_STEP_NAME,
    outputKey: flowKey<UniversitySelectionOutput>('university.selection'),
    async run(context) {
      const plan = select(context.plan);
      const university = context.require(plan.universityKey);
      const student = await actor(context);
      const application = await student.request.post('/universities/apply', {
        json: {
          UniversityID: university.UniversityID,
          role: 'STUDENT',
        },
      });
      expectStatus(application, 201, 'apply for student university role');
      expectObject(application.body, 'apply for student university role');
      assert.equal(application.body.UniversityID, university.UniversityID);
      assert.equal(application.body.role, 'STUDENT');

      const selected = await student.request.post(
        '/api/auth/select-university',
        {
          json: { uniId: university.UniversityID },
        },
      );
      expectStatus(selected, [200, 201], 'select university');
      expectObject(selected.body, 'select university');
      assert.equal(selected.body.uniId, university.UniversityID);
      assert.equal(selected.body.uniRole, 'student');

      const roleResponse = await student.request.get(
        `/universities/role/${university.UniversityID}`,
      );
      expectStatus(roleResponse, 200, 'retrieve university role');

      const user = (selected.body.user ?? {}) as Record<string, unknown>;
      expectString(user.id, 'selected user id');
      const roles = await context.runtime.database
        .select()
        .from(UniversityRole)
        .where(eq(UniversityRole.UserID, user.id));
      const role = roles.find(
        (row) => row.UniversityID === university.UniversityID,
      );
      assert.ok(role, 'Student university role must be persisted');
      assert.equal(role.role, 'STUDENT');

      return {
        actorName: student.name,
        university,
        role,
        selectedSession: selected.body as unknown as SessionData,
      };
    },
  };
}
