// import { AppDatabase, DatabaseService } from "src/db/database.service";
// import { CreateModuleDto, ModuleFiltersDto, ModuleListResponseDto, ModuleSingleResponseDto } from "./dto/module.dto";
import { ModuleService } from './module.service';
// import { NotImplementedException } from "@nestjs/common";
// import { and, eq, getTableColumns, ilike, SQL } from "drizzle-orm";
// import { Course, CourseModule, GroupModules, ModuleEnrollment, modules, ModuleStyling } from "src/entities";

export class ModuleServiceV2 extends ModuleService {
  //   async getAll(
  //     userId: string,
  //     filters: ModuleFiltersDto,
  //     tx?: DatabaseService['db'],
  //   ): Promise<ModuleListResponseDto> {
  //     const db = tx ?? this.dbService.db;
  //     const uniId = filters.universityId?.trim();
  //     const courseId = filters.courseId?.trim();
  //     const groupId = filters.GroupID?.trim();
  //     const moduleCode = filters.moduleCode?.trim();
  //     const enroll = filters.userEnrollment;
  //     let foundModules: ModuleSingleResponseDto[] = [];
  //     const conditions: SQL[] = [];
  //     if (uniId) conditions.push(eq(Course.UniversityID, uniId));
  //     if (courseId) conditions.push(eq(CourseModule.CourseID, courseId));
  //     if (groupId) conditions.push(eq(Course.GroupID, groupId));
  //     if (moduleCode)
  //       conditions.push(ilike(modules.moduleCode, `%${moduleCode}%`));
  //     if (enroll) conditions.push(eq(ModuleEnrollment.UserID, userId));
  //     foundModules = await db
  //       .selectDistinctOn([modules.moduleID], {
  //         ...getTableColumns(modules),
  //         styling: ModuleStyling.styling ?? null,
  //         CourseModuleInfo: getTableColumns(CourseModule),
  //       })
  //       .from(modules)
  //       .leftJoin(
  //         ModuleStyling,
  //         and(
  //           eq(ModuleStyling.ModuleID, modules.moduleID),
  //           eq(ModuleStyling.UserID, userId),
  //         ),
  //       )
  //       .leftJoin(GroupModules, eq(GroupModules.ModuleID, modules.moduleID))
  //       .leftJoin(
  //         CourseModule,
  //         eq(CourseModule.GroupModuleID, GroupModules.GroupModuleID),
  //       )
  //       .leftJoin(Course, eq(Course.CourseID, CourseModule.CourseID))
  //       .leftJoin(
  //         ModuleEnrollment,
  //         and(
  //           eq(ModuleEnrollment.ModuleID, modules.moduleID),
  //           eq(ModuleEnrollment.UserID, userId),
  //         ),
  //       )
  //       .where(and(...conditions));
  //     return {
  //       modules: foundModules,
  //       message: `Returning: ${foundModules.length}-Modules. | With filters: ${JSON.stringify(filters)}`,
  //     };
  //   } //getAll
}
