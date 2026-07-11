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

//Combine all
// export const ALL_SEED_MODULES: SeedModule[] = [
//   ...FUNDAMENTAL_MODULES,
//   ...CORE_MODULES,
//   ...ELECTIVE_MODULES,
// ];
