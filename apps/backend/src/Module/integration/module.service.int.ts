import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../db/database.module';
import { ModuleService } from '../module.service';

describe('ModuleService integration', () => {
  let service: ModuleService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
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
  });

  it('creates a module', async () => {
    const result = await service.create(
      '00000000-0000-0000-0000-000000000001',
      {
        code: 'COS301',
        name: 'Software Engineering',
        description: 'Capstone module',
      },
    );

    expect(result).toMatchObject({
      code: 'COS301',
      name: 'Software Engineering',
    });

    expect(result).toMatchObject({
      code: 'COS301',
      name: 'Software Engineering',
    });
  });
});
