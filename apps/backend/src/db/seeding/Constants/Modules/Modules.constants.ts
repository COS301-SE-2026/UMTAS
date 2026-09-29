//Modules
export interface SeedModule {
  Code: string;
  Name: string;
  Description: string;
  credits: number;
  Core: boolean;
  SemesterOfStudy: string;
  YearOfStudy: number;
}

// Combine all
import * as year1 from './CS_1.constants';
import * as year2 from './CS_2.constants';
import * as year3 from './CS_3.constants';

export const ALL_SEED_MODULES: SeedModule[] = [
  ...year1.ALL_SEED_MODULES,
  ...year2.ALL_SEED_MODULES,
  ...year3.ALL_SEED_MODULES,
];

// Modules used by the attendance conflict demo (the first two seeded modules)
export const ATTENDANCE_DEMO_MODULE_CODES: string[] = ALL_SEED_MODULES.slice(
  0,
  2,
).map((module) => module.Code);
