import { Test, TestingModule } from '@nestjs/testing';
import { ModuleController } from './module.controller';
import { ModuleService } from './module.service';

describe('ModuleController', () => {
  let controller: ModuleController;
  let service: jest.Mocked<ModuleService>;

  const mockModule = {
    id: 'module-id',
    code: 'COS332',
    name: 'Computer Networks',
    description: 'Networks module',
    styling: '#3B82F6',
    userId: 'user-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModuleController],
      providers: [
        {
          provide: ModuleService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ModuleController);
    service = module.get(ModuleService);
  });

  it('should create module', async () => {
    const dto = {
      code: 'COS332',
      name: 'Computer Networks',
      description: 'Networks module',
      styling: '#3B82F6',
      userId: 'user-id',
    };

    service.create.mockResolvedValue({ module: mockModule });

    await expect(controller.createModule(dto)).resolves.toEqual({
      module: mockModule,
    });

    expect(service.create).toHaveBeenCalledWith(dto);
  }); //create

  it('should return all modules', async () => {
    service.getAll.mockResolvedValue({ modules: [mockModule] });

    await expect(controller.getAll()).resolves.toEqual({
      modules: [mockModule],
    });

    expect(service.getAll).toHaveBeenCalled();
  }); //get all

  it('should return one module', async () => {
    service.getById.mockResolvedValue({ module: mockModule });

    await expect(controller.getById('module-id')).resolves.toEqual({
      module: mockModule,
    });

    expect(service.getById).toHaveBeenCalledWith('module-id');
  }); //get one module

  it('should update a module', async () => {
    const dto = { name: 'Updated Networks' };

    service.update.mockResolvedValue({
      module: { ...mockModule, name: 'Updated Networks' },
    });

    await expect(controller.update('module-id', dto)).resolves.toEqual({
      module: { ...mockModule, name: 'Updated Networks' },
    });

    expect(service.update).toHaveBeenCalledWith('module-id', dto);
  }); //update module

  it('should remove a module', async () => {
    service.deleteById.mockResolvedValue({ success: true });

    await expect(controller.delete('module-id')).resolves.toEqual({
      success: true,
    });

    expect(service.deleteById).toHaveBeenCalledWith('module-id');
  }); //Delete
});
