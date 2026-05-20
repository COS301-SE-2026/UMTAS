import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../db/database.module';
import { ModuleService } from '../module.service';

import { DatabaseService } from '../../db/database.service';
import { modules } from '../../entities/Modules/index';

const USER_A = '00000000-0000-0000-0000-000000000001';
const USER_B = '00000000-0000-0000-0000-000000000002';

const cos301 = {
  code: 'COS301',
  name: 'Software Engineering',
  description: 'Capstone module',
};

const cos332 = {
  code: 'COS332',
  name: 'Networks',
  description: 'Horrible',
};

describe('ModuleService integration', () => {
  let moduleRef: TestingModule;
  let service: ModuleService;
  let dbService: DatabaseService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env', '.env.local'],
        }),
        DatabaseModule,
      ],
      providers: [ModuleService],
    }).compile();

    await moduleRef.init();

    service = moduleRef.get(ModuleService);

    dbService = moduleRef.get(DatabaseService);
  });

  beforeEach(async () => {
    await dbService.db.delete(modules);
  });

  //cleanup
  afterAll(async () => {
    await moduleRef?.close();
  });

  //Create Module
  it('creates a module', async () => {
    const result = await service.create(USER_A, {
      code: 'COS301',
      name: 'Software Engineering',
      description: 'Capstone module',
    });

    expect(result).toMatchObject({
      module: {
        moduleCode: 'COS301',
        moduleName: 'Software Engineering',
        moduleDescription: 'Capstone module',
        userID: USER_A,
      },
    });
  });

  //trims + normalizes values
  it('creates module with trimmed + normalized values', async () => {
    const result = await service.create(USER_A, {
      code: ' cos332 ',
      name: ' Networks ',
      description: ' Horrible ',
    });

    expect(result.module).toMatchObject({
      moduleCode: 'COS332',
      moduleName: 'Networks',
      moduleDescription: 'Horrible',
      userID: USER_A,
    });
  });

  //conflict exception for module code to same user
  it('throw ConflictException for duplicate module code for user', async () => {
    await service.create(USER_A, cos301);

    await expect(service.create(USER_A, cos301)).rejects.toThrow(
      'already exists',
    );
  });

  //same module code for different users
  it('no conflict error when same module created for different users', async () => {
    await service.create(USER_A, cos301);
    const result = await service.create(USER_B, cos301);

    expect(result.module).toMatchObject({
      moduleCode: 'COS301',
      userID: USER_B,
    });
  });

  //only return modules for user
  it('return only the modules created by user', async () => {
    await service.create(USER_A, cos301);
    await service.create(USER_B, cos332);

    const result = await service.getAll(USER_A);

    expect(result.modules).toHaveLength(1);
    expect(result.modules[0]).toMatchObject({
      moduleCode: cos301.code,
      userID: USER_A,
    });
  });

  //update
  it('update module', async () => {
    const mod = await service.create(USER_A, cos301);

    const result = await service.update(USER_A, mod.module.moduleID, {
      code: 'COS333333',
      name: 'new Name',
      description: 'updatedDescription',
      styling: '#939393',
    });

    expect(result.module).toMatchObject({
      moduleID: mod.module.moduleID,
      moduleCode: 'COS333333',
      moduleName: 'new Name',
      moduleDescription: 'updatedDescription',
      styling: '#939393',
      userID: USER_A,
    });
  });

  //delete
  it('should delete module after creation', async () => {
    const mod = await service.create(USER_A, cos301);

    await expect(
      service.deleteById(USER_A, mod.module.moduleID),
    ).resolves.toEqual({ success: true });

    await expect(service.getById(USER_A, mod.module.moduleID)).rejects.toThrow(
      'Module not found',
    );
  });
});
