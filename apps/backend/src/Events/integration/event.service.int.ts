import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../db/database.module';
import { ModuleService } from '../../Module/module.service';

import { DatabaseService } from '../../db/database.service';
import { Event, LectureEv } from '../../entities/Events/index';
// import { NotFoundException } from '@nestjs/common';
import { EventService } from '../event.service';
import { EventType } from '../dto/EventDto.dto';

const USER_A = '00000000-0000-0000-0000-000000000001';
const USER_B = '00000000-0000-0000-0000-000000000002';

const cos301 = {
  code: 'COS301',
  name: 'Software Engineering',
  description: 'Capstone module',
};

describe('EventService integration', () => {
  let moduleRef: TestingModule;
  let eService: EventService;
  let mService: ModuleService;
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

    mService = moduleRef.get(ModuleService);
    eService = moduleRef.get(EventService);

    dbService = moduleRef.get(DatabaseService);
  });

  beforeEach(async () => {
    await dbService.db.delete(Event);
    await dbService.db.delete(LectureEv);
  });

  afterAll(async () => {
    await moduleRef?.close();
  });

  //Create simple event
  it('create event - not lecture', async () => {
    const result = await eService.createEvent(USER_A, {
      isRecurring: false,
      eventCriteria: {
        day: 'monday',
        startTime: '08:00',
        endTime: '09:00',
        type: null,
      },
    });

    expect(result.event).toBeDefined();
    expect(result.event.userID).toBe(USER_A);
    expect(result.lecture).toBeUndefined();
  });

  //create lecture event - link to module
  it('create lecture event + link to module', async () => {
    const mod = await mService.create(USER_A, cos301);

    const result = await eService.createEvent(USER_A, {
      eventCriteria: {
        type: EventType.LECTURE,
        day: 'monday',
        startTime: '08:00',
        endTime: '09:00',
        moduleCode: cos301.code,
      },
    });

    expect(result.event).toBeDefined();
    expect(result.lecture).toBeDefined();
    expect(result.lecture?.moduleID).toBe(mod.module.moduleID);
  });

  //GETALLEVENTS
  //return events for user
  it('return only events created by user', async () => {
    await eService.createEvent(USER_A, {
      eventCriteria: {
        day: 'monday',
        startTime: '08:00',
        endTime: '09:00',
      },
    });
    await eService.createEvent(USER_B, {
      eventCriteria: {
        day: 'monday',
        startTime: '08:00',
        endTime: '09:00',
      },
    });

    const { events } = await eService.getAllEvents(USER_A);

    expect(events.length).toBe(1);
    expect(events[0].event.userID).toBe(USER_A);
  });

  //GETBYID
  //event not found
  it('throws NotFoundException for an event that does not belong to the user', async () => {
    const { event } = await eService.createEvent(USER_A, {
      eventCriteria: {
        day: 'monday',
        startTime: '08:00',
        endTime: '09:00',
      },
    });

    await expect(eService.getById(USER_B, event.eventID)).rejects.toThrow(
      'Event not found',
    );
  });

  //DELETEEVENT
  it('deletes an event and returns success', async () => {
    const { event } = await eService.createEvent(USER_A, {
      eventCriteria: {
        day: 'monday',
        startTime: '08:00',
        endTime: '09:00',
      },
    });

    const result = await eService.deleteEvent(USER_A, event.eventID);

    expect(result.success).toBe(true);

    await expect(eService.getById(USER_A, event.eventID)).rejects.toThrow(
      'Event not found',
    );
  });
});
