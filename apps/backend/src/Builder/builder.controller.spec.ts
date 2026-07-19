import { BuilderController } from './builder.controller';
import { BuilderService } from './builder.service';

import { Test } from '@nestjs/testing';

//Constants
import { moduleId } from '../Testing/constants.spec';

//Mock services
import { createMockBuilderService } from '../Testing/Mocks/services';

//Factories
import { createMockSession, createModule } from '../Testing/Factories';
import { userId } from '../Testing/constants.spec';

//DTo's
import { CreateBuilderModuleDto } from './dto/builder.dto';
import {
  ModuleSingleResponseDto,
  UpdateModuleDto,
} from '../Module/dto/module.dto';

describe('BuilderController', () => {
  let controller: BuilderController;
  // let service: BuilderService;

  //mock services
  const { mockBuilderService, reset: resetBuilder } =
    createMockBuilderService();

  const mockSession = createMockSession(userId, 'user');

  //Before
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [BuilderController],
      providers: [{ provide: BuilderService, useValue: mockBuilderService }],
    }).compile();

    controller = module.get<BuilderController>(BuilderController);
    // service = module.get<BuilderService>(BuilderService);
  }); //END_BeforeEach

  //after
  afterEach(() => {
    resetBuilder();
    jest.clearAllMocks();
  }); //END_afterEach

  //TESTS

  //Create
  describe('TEST_create', () => {
    it('should create module', async () => {
      const createDto: CreateBuilderModuleDto = {
        moduleCode: 'someCode',
        moduleName: 'someName',
        moduleDescription: 'someDescription',
        styling: { colour: 'black' },
      };
      const expectedResponse: ModuleSingleResponseDto = {
        moduleID: moduleId,
        moduleCode: createDto.moduleCode,
        moduleName: createDto.moduleName,
        moduleDescription: createDto.moduleDescription,
        styling: createDto.styling,
      };

      mockBuilderService.createModule!.mockResolvedValue(expectedResponse);

      const result = await controller.createModule(mockSession, createDto);

      expect(mockBuilderService.createModule).toHaveBeenCalledWith(
        userId,
        createDto,
      );

      expect(result).toEqual(expectedResponse);
    });
  });

  //GetAll
  describe('TEST_getAll', () => {
    it('should return array of modules', async () => {
      const expectedR = {
        modules: [createModule(), createModule()],
      };

      mockBuilderService.getAllModules!.mockResolvedValue(expectedR);

      //Act
      const result = await controller.getAll(mockSession);

      expect(mockBuilderService.getAllModules).toHaveBeenCalledWith(
        mockSession.user.id,
      );

      expect(result).toMatchObject(expectedR);
    });
  }); //END_TEST_getAll

  //GetById
  describe('TEST_getById', () => {
    it('should return a module by id', async () => {
      //Arrange
      const module = createModule();

      mockBuilderService.getModuleById!.mockResolvedValue(module);

      //Act
      const result = await controller.getById(mockSession, module.moduleID);

      expect(mockBuilderService.getModuleById).toHaveBeenCalledWith(
        mockSession.user.id,
        module.moduleID,
      );
      expect(result).toMatchObject(module);
    });
  }); //END_TEST_getById

  //Update
  describe('TEST_update', () => {
    it('should update module', async () => {
      const module = createModule();
      const updateDto: UpdateModuleDto = {
        moduleCode: 'newCode',
        moduleName: 'newName',
        moduleDescription: 'newDescription',
        styling: { colour: 'black' },
      };
      const expectedR = createModule(updateDto);
      mockBuilderService.updateModule!.mockResolvedValue({
        ...expectedR,
        styling: updateDto.styling,
      });

      const result = await controller.update(
        mockSession,
        module.moduleID,
        updateDto,
      );

      expect(mockBuilderService.updateModule).toHaveBeenCalledWith(
        mockSession.user.id,
        module.moduleID,
        updateDto,
      );

      expect(result).toMatchObject(expectedR);
    });
  }); //END_TEST_update

  //Delete
  describe('TEST_delete', () => {
    it('should delete module by id', async () => {
      //Arrange
      const module = createModule();

      const expectedR = { moduleCode: module.moduleCode, success: true };

      mockBuilderService.deleteModule!.mockResolvedValue(expectedR);

      //Act
      const result = await controller.delete(mockSession, module.moduleID);

      //Assert
      expect(mockBuilderService.deleteModule).toHaveBeenCalledWith(
        mockSession.user.id,
        module.moduleID,
      );

      expect(result).toMatchObject(expectedR);
    });
  }); //END_TEST_delete
}); //END_BuilderController
