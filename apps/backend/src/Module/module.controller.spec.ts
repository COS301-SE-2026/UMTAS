import { Test, TestingModule } from '@nestjs/testing';
import { ModuleController } from './module.controller';
import { ModuleService } from './module.service';

describe('ModuleController', () => {
  let controller: ModuleController;
  let service: jest.Mocked<ModuleService>;

  const mockModule = {
    moduleID: 1,
    moduleCode: 'COS332',
    moduleName: 'Computer Networks',
    moduleDescription: 'Networks module',
    styling: '#3B82F6',
    userID: '550e8400-e29b-41d4-a716-446655440000',
  };

  const session = {
    user: { id: '550e8400-e29b-41d4-a716-446655440000' },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModuleController],
      providers: [
        {
          provide: ModuleService,
          useValue: {
            create: jest.fn(),
            getAll: jest.fn(),
            getById: jest.fn(),
            update: jest.fn(),
            deleteById: jest.fn(),
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
    } as any;

    service.create.mockResolvedValue({ module: mockModule });

    await expect(controller.createModule(dto, session)).resolves.toEqual({
      module: mockModule,
    });

    expect(service.create).toHaveBeenCalledWith(session.user.id, dto);
  });

  it('should return all modules', async () => {
    service.getAll.mockResolvedValue({ modules: [mockModule] });

    await expect(controller.getAll(session)).resolves.toEqual({
      modules: [mockModule],
    });

    expect(service.getAll).toHaveBeenCalledWith(session.user.id);
  });

  it('should return one module', async () => {
    service.getById.mockResolvedValue({ module: mockModule });

    await expect(controller.getById(session, 1)).resolves.toEqual({
      module: mockModule,
    });

    expect(service.getById).toHaveBeenCalledWith(session.user.id, 1);
  });

  it('should update a module', async () => {
    const dto = { name: 'Updated Networks' };

    service.update.mockResolvedValue({
      module: { ...mockModule, moduleName: 'Updated Networks' },
    });

    await expect(controller.update(session, 1, dto)).resolves.toEqual({
      module: { ...mockModule, moduleName: 'Updated Networks' },
    });

    expect(service.update).toHaveBeenCalledWith(session.user.id, 1, dto);
  });

  it('should remove a module', async () => {
    service.deleteById.mockResolvedValue({ success: true });

    await expect(controller.delete(session, 1)).resolves.toEqual({
      success: true,
    });

    expect(service.deleteById).toHaveBeenCalledWith(session.user.id, 1);
  });
});
