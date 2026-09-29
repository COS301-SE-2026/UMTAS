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

//CS
// Combine all
import * as yearCs1 from './CS_1.constants';
import * as yearCs2 from './CS_2.constants';
import * as yearCs3 from './CS_3.constants';

export const ALL_CS_SEED_MODULES: SeedModule[] = [
  ...yearCs1.ALL_SEED_MODULES,
  ...yearCs2.ALL_SEED_MODULES,
  ...yearCs3.ALL_SEED_MODULES,
];

//AS
import * as yearAs1 from './AS_1.constants';
import * as yearAs2 from './AS_2.constants';
import * as yearAs3 from './AS_3.constants';
import * as yearAs4 from './AS_4.constants';

export const ALL_AS_SEED_MODULES: SeedModule[] = [
  ...yearAs1.ALL_SEED_MODULES,
  ...yearAs2.ALL_SEED_MODULES,
  ...yearAs3.ALL_SEED_MODULES,
  ...yearAs4.ALL_SEED_MODULES,
];

//PH - Physiology
import * as yearPh1 from './PH_1.constants';
import * as yearPh2 from './PH_2.constants';
import * as yearPh3 from './PH_3.constants';
import * as yearPh4 from './PH_4.constants';

export const ALL_PH_SEED_MODULES: SeedModule[] = [
  ...yearPh1.ALL_SEED_MODULES,
  ...yearPh2.ALL_SEED_MODULES,
  ...yearPh3.ALL_SEED_MODULES,
  ...yearPh4.ALL_SEED_MODULES,
];

export const ALL_SEED_MODULES: SeedModule[] = [
  ...ALL_CS_SEED_MODULES,
  ...ALL_AS_SEED_MODULES,
  ...ALL_PH_SEED_MODULES,
];

// Modules used by the attendance conflict demo (the first two seeded modules)
export const ATTENDANCE_DEMO_MODULE_CODES: string[] = ALL_SEED_MODULES.slice(
  0,
  2,
).map((module) => module.Code);
