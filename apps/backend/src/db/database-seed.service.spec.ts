import { ConfigService } from '@nestjs/config';
import { DatabaseSeedService } from './database-seed.service';
import type { DatabaseService } from './database.service';
import { AuthSeed } from './seeds/auth.seed';

describe('DatabaseSeedService task selection', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('runs only explicitly selected seed tasks', async () => {
    const service = createService('default-system-admin');
    const privateService = service as unknown as SeedMethodSpies;
    privateService.seedDefaultSystemAdmin = jest.fn();
    privateService.seedUniversity = jest.fn();
    privateService.seedUsersAccounts = jest.fn();
    privateService.seedUniRolesForUP = jest.fn();
    privateService.seedCoursesWithModuleGroupings = jest.fn();

    await service.seed();

    expect(privateService.seedDefaultSystemAdmin).toHaveBeenCalledTimes(1);
    expect(privateService.seedUniversity).not.toHaveBeenCalled();
    expect(privateService.seedUsersAccounts).not.toHaveBeenCalled();
    expect(privateService.seedUniRolesForUP).not.toHaveBeenCalled();
    expect(
      privateService.seedCoursesWithModuleGroupings,
    ).not.toHaveBeenCalled();
  });

  it('registers and runs auth-seed when requested', async () => {
    const authSeed = jest
      .spyOn(AuthSeed.prototype, 'run')
      .mockResolvedValue(undefined);
    const database = {} as DatabaseService;
    const service = new DatabaseSeedService(
      database,
      new ConfigService({ SEED_TASKS: 'auth-seed' }),
    );

    await service.seed();

    expect(authSeed).toHaveBeenCalledWith(database);
  });

  it('rejects unknown task names with the available task list', () => {
    expect(() => createService('missing-seed')).toThrow(
      /Unknown seed task.*auth-seed/,
    );
  });
});

function createService(seedTasks: string): DatabaseSeedService {
  return new DatabaseSeedService(
    {} as DatabaseService,
    new ConfigService({ SEED_TASKS: seedTasks }),
  );
}

interface SeedMethodSpies {
  seedDefaultSystemAdmin: jest.Mock;
  seedUniversity: jest.Mock;
  seedUsersAccounts: jest.Mock;
  seedUniRolesForUP: jest.Mock;
  seedCoursesWithModuleGroupings: jest.Mock;
}
