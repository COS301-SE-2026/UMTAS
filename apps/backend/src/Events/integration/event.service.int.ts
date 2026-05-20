import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../db/database.module';
import { ModuleService } from '../../Module/module.service';

import { DatabaseService } from '../../db/database.service';
import { Event } from '../../entities/Events/index';
// import { NotFoundException } from '@nestjs/common';
import { EventService } from '../event.service';

// const USER_A = '00000000-0000-0000-0000-000000000001';
// const USER_B = '00000000-0000-0000-0000-000000000002';

describe('EventService integration', () => {
  let moduleRef: TestingModule;
  // let eService: EventService;
  // let mService: ModuleService;
  let dbService: DatabaseService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env'],
        }),
        DatabaseModule,
      ],
      providers: [ModuleService, EventService],
    }).compile();

    await moduleRef.init();

    // mService = moduleRef.get(ModuleService);
    // eService = moduleRef.get(EventService);

    dbService = moduleRef.get(DatabaseService);
  });

  beforeEach(async () => {
    await dbService.db.delete(Event);
  });

  afterAll(async () => {
    await moduleRef?.close();
  });

  it('testing', async () => {
    expect(4).toEqual(4);
  });
});
