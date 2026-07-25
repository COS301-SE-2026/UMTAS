import { Test } from '@nestjs/testing';

//Constants
import {} from '../Testing/constants.spec';

//Actual Services
import { GroupingService } from './grouping.service';
import { DatabaseService } from '../db/database.service';
import { CourseService } from '../Course/course.service';

//Mock Database and factories
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { mockTransaction } from '../Testing/Mocks/database.helpers';
import {
  createCourse,
  createGroup,
  createGroupDto,
  createModule,
} from '../Testing/Factories/';

//Mock Services
import { createMockCourseService } from '../Testing/Mocks/services';

//Exceptions
import { InternalServerErrorException } from '@nestjs/common';

//DTO's
import {} from './dto/grouping.dto';

describe('GroupingService', () => {
  let service: GroupingService;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockCourseService, reset: resetCourse } = createMockCourseService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GroupingService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: CourseService, useValue: mockCourseService },
      ],
    }).compile();

    service = module.get(GroupingService);
  });

  afterEach(() => {
    resetDb();
    resetCourse();
  });

  //TESTS
  //Create
  describe('Test_createModuleGrouping', () => {
    //UnHappy - failed to create modulegrouping
    it('should throw if failed to create new group', async () => {
      //Arrange
      const dto = createGroupDto();
      mockTransaction(mockDb, {
        insert: [[]],
      });

      //Act + Assert
      await expect(service.createModuleGrouping(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    //Happy - create gorup with course
    it('should create new group with course - no modules', async () => {
      //Arrange
      const course = createCourse();
      const newGroup = createGroup();
      const dto = createGroupDto({
        CourseID: course.CourseID,
        modules: undefined,
      });

      mockTransaction(mockDb, {
        insert: [[newGroup]],
      });

      const newCourse = createCourse({ GroupID: newGroup.GroupID });
      mockCourseService.getById?.mockResolvedValue(course);
      mockCourseService.update?.mockResolvedValue(newCourse);

      //Act
      const result = await service.createModuleGrouping(dto);

      //Assert
      expect(result).toMatchObject(newGroup);
      expect(mockCourseService.getById).toHaveBeenCalled();
      expect(mockCourseService.update).toHaveBeenCalled();
    });

    //Happy - create group with modules to populate
    it('should create new group with modules', async () => {
      //Arrange
      const modules = [createModule().moduleID, createModule().moduleID];
      const dto = createGroupDto({ modules: modules });
      const group = createGroup();
      const newGroup = {
        ...group,
        modules: modules,
      };

      const spy = jest
        .spyOn(service, 'populateGroup')
        .mockResolvedValue(newGroup);

      mockTransaction(mockDb, {
        insert: [[group]],
      });

      //Act
      const result = await service.createModuleGrouping(dto);

      //Assert
      expect(result).toMatchObject(newGroup);
      expect(spy).toHaveBeenCalled();
    });
  }); //END_Test_createModuleGrouping

  //GetAll
  describe('Test_GetAll', () => {});
});
