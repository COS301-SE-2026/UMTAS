import { Test, TestingModule } from '@nestjs/testing';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';
import {
  CreateTimetableDto,
  UpdateTimetableDto,
  TimetableResponseDto,
} from './dto/timetable.dto';
import { SessionData } from '../auth/session.decorator';

const mockSession = { user: { id: 'user-1' } } as SessionData;

const mockTimetable: TimetableResponseDto = {
  timetable: { timetableID: 1, userID: 'user-1', timetableName: 'Sem 1' },
};

const mockService = {
  createTimetable: jest.fn(),
  getAllTimetables: jest.fn(),
  getTimetableById: jest.fn(),
  updateTimetable: jest.fn(),
  deleteTimetable: jest.fn(),
};

describe('TimetableController', () => {
  let controller: TimetableController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimetableController],
      providers: [{ provide: TimetableService, useValue: mockService }],
    }).compile();

    controller = module.get<TimetableController>(TimetableController);
  });

  describe('createTimetable', () => {
    it('should call service with session userId and dto and return the result', async () => {
      const dto: CreateTimetableDto = { timetableName: 'Sem 1' };
      mockService.createTimetable.mockResolvedValue(mockTimetable);

      const result = await controller.createTimetable(mockSession, dto);

      expect(mockService.createTimetable).toHaveBeenCalledWith('user-1', dto);
      expect(result).toBe(mockTimetable);
    });
  });

  describe('getAllTimetables', () => {
    it('should call service with session userId and return the timetable list', async () => {
      const expected = { timetables: [mockTimetable] };
      mockService.getAllTimetables.mockResolvedValue(expected);

      const result = await controller.getAllTimetables(mockSession);

      expect(mockService.getAllTimetables).toHaveBeenCalledWith('user-1');
      expect(result).toBe(expected);
    });
  });

  describe('getTimetableById', () => {
    it('should call service with session userId and timetable id and return the result', async () => {
      mockService.getTimetableById.mockResolvedValue(mockTimetable);

      const result = await controller.getTimetableById(mockSession, 1);

      expect(mockService.getTimetableById).toHaveBeenCalledWith('user-1', 1);
      expect(result).toBe(mockTimetable);
    });
  });

  describe('updateTimetable', () => {
    it('should call service with session userId, id, and dto and return the updated timetable', async () => {
      const dto: UpdateTimetableDto = { timetableName: 'Sem 2' };
      mockService.updateTimetable.mockResolvedValue(mockTimetable);

      const result = await controller.updateTimetable(mockSession, 1, dto);

      expect(mockService.updateTimetable).toHaveBeenCalledWith(
        'user-1',
        1,
        dto,
      );
      expect(result).toBe(mockTimetable);
    });
  });

  describe('deleteTimetable', () => {
    it('should call service with session userId and id and return success', async () => {
      const expected = { success: true };
      mockService.deleteTimetable.mockResolvedValue(expected);

      const result = await controller.deleteTimetable(mockSession, 1);

      expect(mockService.deleteTimetable).toHaveBeenCalledWith('user-1', 1);
      expect(result).toBe(expected);
    });
  });
});
