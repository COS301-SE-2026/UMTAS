import { randomUUID } from "crypto";
import { modules, CourseModule, ModuleEnrollment, ModuleStyling } from "src/entities";
import { courseId } from "../constants.spec";

export const baseDto = {
    moduleCode: 'COS332',
    moduleName: 'Networks and stuff',
    moduleDescription: 'Networks for the dweebs',
    courseID: courseId
};


type Module = typeof modules.$inferSelect;

//create a module
export function createModule(
    overrides: Partial<Module>={}
): Module {

    return {
        moduleID: randomUUID(),
        moduleCode: 'COS332',
        moduleName: 'Networks',
        moduleDescription: 'About Networks',

        ...overrides
    };
}//END_createModule

type CourseModule = typeof CourseModule.$inferSelect;
//Create a course owned module - the join table
export function createCourseModule(
    overrides: Partial<CourseModule>={}
): CourseModule{

    return {
        ModuleID: randomUUID(),
        CourseID: randomUUID(),

        ...overrides
    };
}//END_CourseModule

type ModuleEnrollment = typeof ModuleEnrollment.$inferSelect;
//Enroll use to module
export function createModuleEnrollment(
    overrides: Partial<ModuleEnrollment>={}
): ModuleEnrollment{

    return {
        ModuleID: randomUUID(),
        UserID: randomUUID(),

        ...overrides
    };
}//END_createModuleEnrollment


type ModuleStyling = typeof ModuleStyling.$inferSelect;

export function createModuleStyling(
    overrides: Partial<ModuleStyling> = {}
): ModuleStyling{

    return {
        ModuleID: randomUUID(),
        UserID: randomUUID(),
        styling: {colour: '#FFFFFF'},

        ...overrides
    };
}//END_createModuleStyling


