import { BuilderServiceV2 } from './builderV2.service';
import { Test } from '@nestjs/testing';

//Constants
import { userId, moduleId, uniId, eventId } from '../Testing/constants';

//Mock services
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  createMockUniversityService,
  createMockCourseServiceV2,
  createMockModuleServiceV2,
  createMockEventServiceV2,
} from '../Testing/Mocks/services';
import { DatabaseService } from '../db/database.service';
import { UniversityService } from '../University/university.service';
import { CourseServiceV2 } from '../Course/courseV2.service';
import { ModuleServiceV2 } from '../Module/moduleV2.service';
import { EventServiceV2 } from '../Events/eventV2.service';

//Mock functions on db
import { mockTransaction } from '../Testing/Mocks';

//Factories
import {
  createModule,
  createEventDto,
  createCourse,
} from '../Testing/Factories';

describe('BuilderServiceV2', () => {
  let service: BuilderServiceV2;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockUniversityService, reset: resetUni } =
    createMockUniversityService();
  const { mockCourseServiceV2, reset: resetCourse } =
    createMockCourseServiceV2();
  const { mockModuleServiceV2, reset: resetModules } =
    createMockModuleServiceV2();
  const { mockEventServiceV2, reset: resetEvents } = createMockEventServiceV2();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BuilderServiceV2,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: UniversityService, useValue: mockUniversityService },
        { provide: CourseServiceV2, useValue: mockCourseServiceV2 },
        { provide: ModuleServiceV2, useValue: mockModuleServiceV2 },
        { provide: EventServiceV2, useValue: mockEventServiceV2 },
      ],
    }).compile();

    service = module.get(BuilderServiceV2);
  });

  afterEach(() => {
    resetDb();
    resetUni();
    resetCourse();
    resetModules();
    resetEvents();
  });

  describe('Test_CreateEvent', () => {
    it('should create event with personal module', async () => {
      mockTransaction(mockDb, {
        select: [
          [
            {
              UserID: userId,
              UniversityID: uniId,
              role: 'STUDENT_OWNED',
            }, //doUserUniCourseCheck
          ],
        ],
        insert: [],
      });

      const course = createCourse();

      mockCourseServiceV2.getAll!.mockResolvedValue({
        courses: [course],
      });

      const module = createModule({
        moduleID: moduleId,
        moduleCode: 'PERS',
      });

      mockModuleServiceV2.getAll!.mockResolvedValue({
        modules: [module],
      });

      const event = createEventDto(
        {
          eventId: eventId,
          eventName: 'Personal Event',
        },
        {},
      );

      mockEventServiceV2.createV2!.mockResolvedValue({
        event,
      });

      //Act
      const result = await service.createEvent(userId, {
        eventName: 'Personal Event',
        activityCode: 'PERS',
        activityType: 'lecture',
        isRecurring: false,
      });

      //Assert
      expect(result).toMatchObject({
        event,
        message: `Personal event[${result.event.eventName}] created.`,
      });
    });
  });

  describe('Test_GetPersonalModule', () => {
    it('should return existing personal module', async () => {
      //Arrange
      mockTransaction(mockDb, {
        select: [
          [
            {
              UserID: userId,
              UniversityID: uniId,
              role: 'STUDENT_OWNED',
            }, //doUserUniCOurseCheck
          ],
        ],
        insert: [],
      });

      const course = createCourse();

      mockCourseServiceV2.getAll!.mockResolvedValue({
        courses: [course],
      });

      const module = createModule({
        moduleID: moduleId,
        moduleCode: 'PERS',
      });

      mockModuleServiceV2.getAll!.mockResolvedValue({
        modules: [module],
        message: 'Module found',
      });

      //Act
      const result = await service.getPersonalModule(userId);

      //Assert
      expect(result).toMatchObject(module);
    });

    it('should create personal module if not exists', async () => {
      //Arrange
      mockTransaction(mockDb, {
        select: [
          [
            {
              UserID: userId,
              UniversityID: uniId,
              role: 'STUDENT_OWNED',
            }, //doUserUniCOurseCheck
          ],
        ],
        insert: [],
      });

      const course = createCourse();

      mockCourseServiceV2.getAll!.mockResolvedValue({
        courses: [course],
      });

      mockModuleServiceV2.getAll!.mockResolvedValue({
        modules: [],
        message: 'Module found',
      });

      const module = createModule({
        moduleID: moduleId,
        moduleCode: 'PERS',
      });

      mockModuleServiceV2.create!.mockResolvedValue(module);

      //Act
      const result = await service.getPersonalModule(userId);

      //Assert
      expect(result).toMatchObject(module);
    });
  });
});
