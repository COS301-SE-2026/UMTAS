import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../db/database.module';

import { DatabaseService } from '../../db/database.service';
import {
  EventsToTimetables,
  Timetable,
} from '../../entities/Events/events.schema';
import { Event } from '../../entities/Events/index';
// import { NotFoundException } from '@nestjs/common';
import { EventService } from '../../Events/event.service';
import { TimetableService } from '../timetable.service';

const USER_A = '00000000-0000-0000-0000-000000000001';
const USER_B = '00000000-0000-0000-0000-000000000002';

const eC = {
  day: 'monday',
  startTime: '08:00',
  endTime: '09:00',
};

describe('EventService integration', () => {
  let moduleRef: TestingModule;
  let eService: EventService;
  let dbService: DatabaseService;
  let tService: TimetableService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env'],
        }),
        DatabaseModule,
      ],
      providers: [EventService, TimetableService],
    }).compile();

    await moduleRef.init();

    eService = moduleRef.get(EventService);
    tService = moduleRef.get(TimetableService);

    dbService = moduleRef.get(DatabaseService);
  });

  beforeEach(async () => {
    await dbService.db.delete(EventsToTimetables);
    await dbService.db.delete(Timetable);
    await dbService.db.delete(Event);
  });

  afterAll(async () => {
    await moduleRef?.close();
  });

  //CREATE
  // ── createTimetable ────────────────────────────────────────
  //create clean timetable
  it('create timetable with no events', async () => {
    const result = await tService.createTimetable(USER_A, {
      timetableName: 'Empty Timetable',
    });

    expect(result.timetable).toBeDefined();
    expect(result.timetable.userID).toBe(USER_A);
    expect(result.timetable.timetableName).toBe('Empty Timetable');
    expect(result.eventIds).toBeUndefined();
  });

  //timetable with events
  it('create timetable with events', async () => {
    const { event: e1 } = await eService.createEvent(USER_A, {
      eventCriteria: eC,
    });
    const { event: e2 } = await eService.createEvent(USER_A, {
      eventCriteria: eC,
    });

    const result = await tService.createTimetable(USER_A, {
      timetableName: 'Timetable2',
      eventIds: [e1.eventID, e2.eventID],
    });

    expect(result.eventIds).toHaveLength(2);
    expect(result.eventIds).toContain(e1.eventID);
    expect(result.eventIds).toContain(e2.eventID);
  });

  //cant create timetable with other users event
  it('throws when creating a timetable with an event owned by another user', async () => {
    const { event } = await eService.createEvent(USER_B, { eventCriteria: eC });

    await expect(
      tService.createTimetable(USER_A, {
        timetableName: 'NotGonnaHappen',
        eventIds: [event.eventID],
      }),
    ).rejects.toThrow('Events not found or not owned by user');
  });

  //GETALL
  //return timetables specific to user
  it('returns only timetables belonging to the requesting user', async () => {
    await tService.createTimetable(USER_A, { timetableName: 'A' });
    await tService.createTimetable(USER_A, { timetableName: 'A2' });
    await tService.createTimetable(USER_B, { timetableName: 'B' });

    const { timetables } = await tService.getAllTimetables(USER_A);

    expect(timetables).toHaveLength(2);
    expect(timetables[0].timetable.userID).toBe(USER_A);
  });

  //GETBYID
  //fetch only for user
  it('NotFoundException when not defined for user', async () => {
    const { timetable } = await tService.createTimetable(USER_A, {
      timetableName: 'A',
    });

    await expect(
      tService.getTimetableById(USER_B, timetable.timetableID),
    ).rejects.toThrow('Timetable not found');
  });

  //UPDATE
  //update timetable name
  it('update timetable name', async () => {
    const { timetable } = await tService.createTimetable(USER_A, {
      timetableName: 'Old',
    });

    const result = await tService.updateTimetable(
      USER_A,
      timetable.timetableID,
      { timetableName: 'New' },
    );

    expect(result.timetable.timetableName).toBe('New');
  });

  //add / remove events from timetable
  it('adds and removes events from a timetable', async () => {
    const { event: e1 } = await eService.createEvent(USER_A, {
      eventCriteria: eC,
    });
    const { event: e2 } = await eService.createEvent(USER_A, {
      eventCriteria: eC,
    });

    const { timetable } = await tService.createTimetable(USER_A, {
      timetableName: 'T',
      eventIds: [e1.eventID],
    });

    const result = await tService.updateTimetable(
      USER_A,
      timetable.timetableID,
      {
        addEventIds: [e2.eventID],
        removeEventIds: [e1.eventID],
      },
    );

    expect(result.eventIds).toContain(e2.eventID);
    expect(result.eventIds).not.toContain(e1.eventID);
  });

  //no update fields given
  it('throws when no update fields are provided', async () => {
    const { timetable } = await tService.createTimetable(USER_A, {
      timetableName: 'T',
    });

    await expect(
      tService.updateTimetable(USER_A, timetable.timetableID, {}),
    ).rejects.toThrow('At least one update field required');
  });

  //DELETE
  //delete timetable
  it('delete timetable', async () => {
    const { timetable } = await tService.createTimetable(USER_A, {
      timetableName: 'A',
    });

    const result = await tService.deleteTimetable(
      USER_A,
      timetable.timetableID,
    );
    expect(result.success).toBe(true);

    await expect(
      tService.getTimetableById(USER_A, timetable.timetableID),
    ).rejects.toThrow('Timetable not found');
  });

  //cant delete another users timetable
  it('throws when deleting a timetable owned by another user', async () => {
    const { timetable } = await tService.createTimetable(USER_A, {
      timetableName: 'A',
    });

    await expect(
      tService.deleteTimetable(USER_B, timetable.timetableID),
    ).rejects.toThrow('Timetable not found');
  });
});
