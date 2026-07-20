// import { Test } from '@nestjs/testing';

// //Constants
// import { userId, moduleId, uniId } from '../Testing/constants.spec';

// //Actual Service imports
// import { DatabaseService } from '../db/database.service';
// import { EventService } from './event.service';
// import { ModuleService } from '../Module/module.service';
// import {EventImportFingerprintService} from './event-import-fingerprint.service';

// //Mocks
// import {
//   createMockDatabase,
//   mockDbResult,
//   mockSequentialResults,
//   mockTransaction
// } from '../Testing/Mocks/';
// import {
//   createMockModuleService,
//   createMockEventImportFingerprintService
// } from '../Testing/Mocks/services/';

// //Factories
// import {
//   createEvent,
//   createEventVenue,
//   createVenue,
//   createUniversityEvent,
//   createCreateEventDto,
// } from '../Testing/Factories/';

// import { EventSource } from './dto/event.types';
// import { UpdateEventDto } from './dto/EventDto.dto';

// describe('EventService', () => {
//   let service: EventService;

//   const { mockDb, reset: resetDb } = createMockDatabase();
//   const { mockModuleService, reset: resetModule } = createMockModuleService();
//   const {mockEventFingerprintService, reset: resetEventFingerprint} = createMockEventImportFingerprintService();

//   beforeEach(async () => {
//     const module = await Test.createTestingModule({
//       providers: [
//         EventService,
//         { provide: DatabaseService, useValue: { db: mockDb } },
//         { provide: ModuleService, useValue: mockModuleService },
//         {provide: EventImportFingerprintService, useValue: mockEventFingerprintService}
//       ],
//     }).compile();

//     service = module.get(EventService);
//   });

//   afterEach(() => {
//     resetDb();
//     resetModule();
//     resetEventFingerprint();
//   });

//   //TESTS
//   //Create
//   describe('Test_CreateEvent', () => {
//     it('should create a simple university event', async () => {
//       //Arrange
//       const newEvent = createEvent(
//         EventSource.UNIVERSITY,
//         {},
//         { moduleId },
//       );
//       const createEventDto = createCreateEventDto(newEvent);

//       const uniEvent = createUniversityEvent({
//         moduleID: moduleId,
//         eventID: newEvent.eventID,
//       });
//       const venue = createVenue({
//         VenueName: 'test_venue'
//       });
//       const eventVenue = createEventVenue({
//         VenueID: venue.VenueID,
//         EventID: newEvent.eventID,
//       });

//       mockTransaction(mockDb, {
//         select: [[]]
//         insert: [[newEvent], [uniEvent], [venue], [eventVenue]]
//       });

//       //Act
//       const result = await service.create(userId, createEventDto);

//       //Assert
//       expect(result.event).toMatchObject(newEvent);

//     //   mockSequentialResults<any>(mockDb.insert, [
//     //     [newEvent],
//     //     [uniEvent],
//     //     [venue],
//     //     [eventVenue],
//     //   ]);
//     //   mockModuleService.getUniForModule?.mockResolvedValue({
//     //     UniversityID: uniId,
//     //   });

//     //   mockTransaction(mockDb);

//     //   const result = await service.create(userId, createEventDto);

//     //   expect(mockDb.insert).toHaveBeenCalledTimes(4);
//     //   expect(mockModuleService.getUniForModule).toHaveBeenCalledWith(moduleId);
//     //   expect(result.event).toMatchObject(newEvent);
//     });
//   });

//   // //GetAll
//   // describe('Test_GetAllEvents', () => {
//   //   it('should return all events for module', async () => {
//   //     const type = EventSource.UNIVERSITY;
//   //     const events = [
//   //       createEvent(type, {}, { moduleId }),
//   //       createEvent(type, {}, { moduleId }),
//   //     ];

//   //     mockSequentialResults(mockDb.select, [events]);

//   //     const result = await service.getAllEvents(userId, { moduleId });

//   //     expect(result).toMatchObject({ events });
//   //   });
//   // });

//   // //GetById
//   // describe('Test_GetEventById', () => {
//   //   it('should return event by eventId', async () => {
//   //     const event = createEvent() as any;

//   //     mockSequentialResults(mockDb.select, [[event]]);

//   //     const result = await service.getById(event.eventID);

//   //     expect(result).toMatchObject({ event });
//   //   });
//   // });

//   // //Update
//   // describe('Test_UpdateEvent', () => {
//   //   it('should update all event fields', async () => {
//   //     //Arrange
//   //     const oldEvent = createEvent() as any;
//   //     const updateDto: UpdateEventDto = {
//   //       eventName: 'NewName',
//   //       activityCode: 'newCode',
//   //       isRecurring: false,
//   //       eventCriteria: {
//   //         date: 'dd-mm-yyyy',
//   //         startTime: '20:00',
//   //         endTime: '21:00'
//   //       },
//   //     };
//   //     const updatedEvent = createEvent(
//   //       EventSource.UNIVERSITY,
//   //       {
//   //         eventName: updateDto.eventName,
//   //         activityCode: updateDto.activityCode,
//   //         isRecurring: updateDto.isRecurring,
//   //       },
//   //       {
//   //         date: updateDto.eventCriteria?.date,
//   //         startTime: updateDto.eventCriteria?.startTime,
//   //         endTime: updateDto.eventCriteria?.endTime
//   //       },
//   //     );

//   //     mockSequentialResults(mockDb.select, [[oldEvent]]);

//   //     mockDb.transaction.mockImplementation((callback: (tx: any) => any) => {
//   //       const tx = {
//   //         update: jest.fn().mockReturnThis(),
//   //         set: jest.fn().mockReturnThis(),
//   //         where: jest.fn().mockReturnThis(),
//   //         returning: jest.fn().mockResolvedValue([updatedEvent]),
//   //       };

//   //       return callback(tx);
//   //     });

//   //     //Act
//   //     const result = await service.updateEvent(
//   //       userId,
//   //       'uni_admin',
//   //       oldEvent.eventID,
//   //       updateDto,
//   //     );

//   //     //Assert
//   //     expect(result).toMatchObject({ event: updatedEvent });
//   //   });
//   // });

//   // //Delete
//   // describe('Test_DeleteEvent', () => {
//   //   it('should delete event - admin', async () => {
//   //     const event = createEvent() as any;

//   //     mockSequentialResults(mockDb.select, [[event]]);
//   //     mockSequentialResults(mockDb.delete, [[]]);

//   //     const result = await service.deleteEvent(
//   //       userId,
//   //       'uni_admin',
//   //       event.eventID,
//   //     );

//   //     //Assert
//   //     expect(result).toMatchObject({
//   //       eventName: event.eventName,
//   //       eventCode: event.eventCode,
//   //       success: true,
//   //     });
//   //   });
//   // });

//   // describe('Test_createPersonalEvent', () => {
//   //   it('should create a personal event', async () => {
//   //     mockDbResult(mockDb.insert, [createEvent(EventSource.PERSONAL)]);

//   //     const result = await service.createPersonalEvent(
//   //       userId,
//   //       createCreateEventDto(createEvent(EventSource.PERSONAL)),
//   //     );

//   //     expect(result).toMatchObject({
//   //       eventCriteria: expect.objectContaining({
//   //         date: expect.any(String),
//   //         startTime: expect.any(String),
//   //         endTime: expect.any(String),
//   //         type: 'personal',
//   //       }),
//   //     });
//   //   });
//   // });
// });
