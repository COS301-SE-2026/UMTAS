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
