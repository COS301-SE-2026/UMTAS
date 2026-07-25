import { Test } from '@nestjs/testing';

//Constants
import { groupId, moduleId } from '../Testing/constants.spec';

//Actual Services
import { GroupingService } from './grouping.service';
import { DatabaseService } from '../db/database.service';
import { CourseService } from '../Course/course.service';

//Mock Database and factories
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  mockDbResult,
  mockSequentialResults,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
import {
  createCourse,
  createGroup,
  createGroupDto,
  createModule,
} from '../Testing/Factories/';

//Mock Services
import { createMockCourseService } from '../Testing/Mocks/services';

//Exceptions
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

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
  describe('Test_GetAll', () => {
    //UnHappy - should return empty array if none found
    it('should return empty array if no groups found', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await service.getAll();

      //Assert
      expect(result).toMatchObject({ groups: [] });
    });

    //Happy - should return array of groups with modules
    it('should return array of groups with their modules', async () => {
      //Arrange
      const mockResults = [
        { GroupID: 'g1', Hash: 'h1', ModuleID: 'm1' },
        { GroupID: 'g1', Hash: 'h1', ModuleID: 'm2' },
        { GroupID: 'g2', Hash: 'h2', ModuleID: 'm3' },
      ];

      mockDbResult(mockDb.select, mockResults);

      //Act
      const result = await service.getAll();

      //Assert
      expect(result.groups).toHaveLength(2);

      const g1 = result.groups.find((g) => g.GroupID === 'g1');
      expect(g1?.modules).toEqual(['m1', 'm2']);
      expect(g1?.Hash).toBe('h1');

      const g2 = result.groups.find((g) => g.GroupID === 'g2');
      expect(g2?.modules).toEqual(['m3']);
      expect(g2?.Hash).toBe('h2');
    });
  }); //END_Test_GetAll

  //GetById
  describe('Test_getById', () => {
    //UnHappy - throw if no group found
    it('should throw if no group found for id', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act + Assert
      await expect(service.getById(groupId)).rejects.toThrow(NotFoundException);
    });

    //Happy - should return group with modules for the group
    it('should return group with its modules', async () => {
      //Arrange
      const group = createGroup();

      mockSequentialResults(mockDb.select, [
        [group],
        [{ ModuleID: moduleId }],
      ] as any);

      //Act
      const result = await service.getById(group.GroupID);

      //Assert
      expect(result).toMatchObject({
        ...group,
        modules: [moduleId],
      });
      expect(mockDb.select).toHaveBeenCalledTimes(2);
    });
  }); //END_Test_getById

  //Update
  describe('Test_updateGroup', () => {
    //UnHappy - throw if group does not exist
    it('should throw if group does not exist', async () => {
      //Arrange
      mockTransaction(mockDb, {
        select: [
          [], //getByid
        ],
      });

      //Act + Assert
      await expect(service.updateGroup(groupId, 'someHash')).rejects.toThrow(
        NotFoundException,
      );
    });

    //Happy - return old group if nothing to update
    it('should return early with old group if nothing to update', async () => {
      //Assert
      const group = createGroup({ Hash: 'someHash' });
      mockTransaction(mockDb, {
        select: [
          [group], //getByid
        ],
      });

      //Act
      const result = await service.updateGroup(group.GroupID, group.Hash!);

      //Assert
      expect(result).toMatchObject(group);
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    //Happy - update the groups hash to new hash
    it('should update the groups hash', async () => {
      //Assert
      const group = createGroup({ GroupID: groupId });
      const newGroup = createGroup({ GroupID: groupId, Hash: 'NEWHASH' });
      console.log(`HEre: ${JSON.stringify(newGroup)}`);
      mockTransaction(mockDb, {
        select: [
          [group], //getByid
          [newGroup], //second getById
        ],
        update: [[newGroup]],
      });

      //Act
      const result = await service.updateGroup(groupId, newGroup.Hash!);

      //Assert
      expect(result).toMatchObject(newGroup);
      expect(mockDb.update).toHaveBeenCalled();
    });
  }); //END_Test_updateGroup
});
