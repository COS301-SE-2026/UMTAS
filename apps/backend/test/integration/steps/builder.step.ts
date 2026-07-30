import assert from 'node:assert/strict';
import { and, eq } from 'drizzle-orm';
import {
  Course,
  GroupModules,
  ModuleEnrollment,
  ModuleStyling,
  UniversityRole,
  modules,
} from '../../../src/entities';
import {
  flowKey,
  type FlowKey,
  type OutputIntegrationStep,
} from '../framework/contracts';
import type { AuthenticationStepOutput } from './authentication.step';
import {
  expectObject,
  expectStatus,
  expectString,
  type ActorResolver,
} from './step-support';

export const BUILDER_MODULE_LIFECYCLE_STEP_NAME =
  'manage a custom student module';

export type BuilderModuleLifecyclePlan = {
  readonly authenticationKey: FlowKey<AuthenticationStepOutput>;
  readonly moduleCode: string;
  readonly initialName: string;
  readonly updatedName: string;
  readonly initialColour: string;
  readonly updatedColour: string;
};

export type BuilderModuleLifecycleOutput = {
  readonly moduleId: string;
  readonly moduleCode: string;
};

export type BuilderModuleCreationPlan = {
  readonly authenticationKey: FlowKey<AuthenticationStepOutput>;
  readonly moduleCode: string;
  readonly moduleName: string;
  readonly colour: string;
};

export type BuilderModuleCreationOutput = {
  readonly moduleId: string;
  readonly moduleCode: string;
  readonly moduleName: string;
  readonly courseId: string;
};

export function builderModuleCreationStep<TPlan>(
  select: (plan: TPlan) => BuilderModuleCreationPlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, BuilderModuleCreationOutput> {
  return {
    name: 'create a custom student module',
    outputKey: flowKey<BuilderModuleCreationOutput>('builder.module.created'),
    async run(context) {
      const plan = select(context.plan);
      const { userId } = context.require(plan.authenticationKey);
      const student = await actor(context);
      const moduleCode = plan.moduleCode.toUpperCase();

      const created = await student.request.post('/builder', {
        json: {
          moduleCode: plan.moduleCode,
          moduleName: plan.moduleName,
          moduleDescription: 'Created through the manual timetable builder',
          styling: { colour: plan.colour },
        },
      });
      expectStatus(created, 201, 'create custom module');
      expectObject(created.body, 'create custom module');
      expectString(created.body.moduleID, 'custom module ID');
      assert.equal(created.body.moduleCode, moduleCode);
      assert.equal(created.body.moduleName, plan.moduleName);
      assert.deepEqual(created.body.styling, { colour: plan.colour });
      const moduleId = created.body.moduleID;

      const [persistedModule, enrollment, styling, courseLinks] =
        await Promise.all([
          context.runtime.database
            .select()
            .from(modules)
            .where(eq(modules.moduleID, moduleId)),
          context.runtime.database
            .select()
            .from(ModuleEnrollment)
            .where(
              and(
                eq(ModuleEnrollment.ModuleID, moduleId),
                eq(ModuleEnrollment.UserID, userId),
              ),
            ),
          context.runtime.database
            .select()
            .from(ModuleStyling)
            .where(
              and(
                eq(ModuleStyling.ModuleID, moduleId),
                eq(ModuleStyling.UserID, userId),
              ),
            ),
          context.runtime.database
            .select({
              courseId: Course.CourseID,
              universityId: Course.UniversityID,
            })
            .from(GroupModules)
            .innerJoin(Course, eq(Course.GroupID, GroupModules.GroupID))
            .where(eq(GroupModules.ModuleID, moduleId)),
        ]);
      assert.equal(persistedModule.length, 1);
      assert.equal(enrollment.length, 1);
      assert.deepEqual(styling[0]?.styling, { colour: plan.colour });
      assert.equal(courseLinks.length, 1);

      const ownedUniversity = await context.runtime.database
        .select()
        .from(UniversityRole)
        .where(
          and(
            eq(UniversityRole.UserID, userId),
            eq(UniversityRole.UniversityID, courseLinks[0].universityId),
            eq(UniversityRole.role, 'STUDENT_OWNED'),
          ),
        );
      assert.equal(ownedUniversity.length, 1);

      return {
        moduleId,
        moduleCode,
        moduleName: plan.moduleName,
        courseId: courseLinks[0].courseId,
      };
    },
  };
}

export type BuilderModuleDeletionPlan = {
  readonly moduleKey: FlowKey<BuilderModuleCreationOutput>;
};

export function builderModuleDeletionStep<TPlan>(
  select: (plan: TPlan) => BuilderModuleDeletionPlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, BuilderModuleCreationOutput> {
  return {
    name: 'delete a custom student module',
    outputKey: flowKey<BuilderModuleCreationOutput>('builder.module.deleted'),
    async run(context) {
      const module = context.require(select(context.plan).moduleKey);
      const student = await actor(context);
      const deleted = await student.request.delete(
        `/builder/${module.moduleId}`,
      );
      expectStatus(deleted, 200, 'delete custom module');
      expectObject(deleted.body, 'delete custom module');
      assert.equal(deleted.body.success, true);
      assert.equal(deleted.body.moduleCode, module.moduleCode);

      const remaining = await context.runtime.database
        .select()
        .from(modules)
        .where(eq(modules.moduleID, module.moduleId));
      assert.equal(remaining.length, 0);
      return module;
    },
  };
}

export function builderModuleLifecycleStep<TPlan>(
  select: (plan: TPlan) => BuilderModuleLifecyclePlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, BuilderModuleLifecycleOutput> {
  return {
    name: BUILDER_MODULE_LIFECYCLE_STEP_NAME,
    outputKey: flowKey<BuilderModuleLifecycleOutput>(
      'builder.module.lifecycle',
    ),
    async run(context) {
      const plan = select(context.plan);
      const { userId } = context.require(plan.authenticationKey);
      const student = await actor(context);

      const created = await student.request.post('/builder', {
        json: {
          moduleCode: plan.moduleCode,
          moduleName: plan.initialName,
          moduleDescription: 'Created through the manual timetable builder',
          styling: { colour: plan.initialColour },
        },
      });
      expectStatus(created, 201, 'create custom module');
      expectObject(created.body, 'create custom module');
      expectString(created.body.moduleID, 'custom module ID');
      assert.equal(created.body.moduleCode, plan.moduleCode.toUpperCase());
      assert.equal(created.body.moduleName, plan.initialName);
      assert.deepEqual(created.body.styling, {
        colour: plan.initialColour,
      });
      const moduleId = created.body.moduleID;

      const fetched = await student.request.get(`/builder/${moduleId}`);
      expectStatus(fetched, 200, 'retrieve custom module');
      expectObject(fetched.body, 'retrieve custom module');
      assert.equal(fetched.body.moduleID, moduleId);

      const listed = await student.request.get('/builder');
      expectStatus(listed, 200, 'list custom modules');
      expectObject(listed.body, 'list custom modules');
      assert.ok(Array.isArray(listed.body.modules));
      assert.ok(
        listed.body.modules.some(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            (item as Record<string, unknown>).moduleID === moduleId,
        ),
      );

      const updated = await student.request.patch(`/builder/${moduleId}`, {
        json: {
          moduleName: plan.updatedName,
          styling: { colour: plan.updatedColour },
        },
      });
      expectStatus(updated, 200, 'update custom module');
      expectObject(updated.body, 'update custom module');
      assert.equal(updated.body.moduleID, moduleId);
      assert.equal(updated.body.moduleName, plan.updatedName);
      assert.deepEqual(updated.body.styling, {
        colour: plan.updatedColour,
      });

      const [persistedModule, enrollment, styling] = await Promise.all([
        context.runtime.database
          .select()
          .from(modules)
          .where(eq(modules.moduleID, moduleId)),
        context.runtime.database
          .select()
          .from(ModuleEnrollment)
          .where(
            and(
              eq(ModuleEnrollment.ModuleID, moduleId),
              eq(ModuleEnrollment.UserID, userId),
            ),
          ),
        context.runtime.database
          .select()
          .from(ModuleStyling)
          .where(
            and(
              eq(ModuleStyling.ModuleID, moduleId),
              eq(ModuleStyling.UserID, userId),
            ),
          ),
      ]);
      assert.equal(persistedModule.length, 1);
      assert.equal(persistedModule[0].moduleName, plan.updatedName);
      assert.equal(enrollment.length, 1);
      assert.equal(styling.length, 1);
      assert.deepEqual(styling[0].styling, { colour: plan.updatedColour });

      const deleted = await student.request.delete(`/builder/${moduleId}`);
      expectStatus(deleted, 200, 'delete custom module');
      expectObject(deleted.body, 'delete custom module');
      assert.equal(deleted.body.success, true);
      assert.equal(deleted.body.moduleCode, plan.moduleCode.toUpperCase());

      const remaining = await context.runtime.database
        .select()
        .from(modules)
        .where(eq(modules.moduleID, moduleId));
      assert.equal(remaining.length, 0);

      return {
        moduleId,
        moduleCode: plan.moduleCode.toUpperCase(),
      };
    },
  };
}
