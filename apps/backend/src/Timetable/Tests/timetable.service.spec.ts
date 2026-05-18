import { Test, TestingModule } from '@nestjs/testing';
import { TimetableService } from '../timetable.service';

describe('TimetableService', () => {
  let service: TimetableService;

  //fakedb
  const mockReturning = jest.fn();

  const mockValues = jest.fn().mockRetrunValue({
    returning: mockReturning,
  });

  const mockDb = {
    insert: jest.fn().mockReturnValue({
      values: mockValues,
    }),
  };

  //fake db service
  const mockDatabaseService = { db: mockDb };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimetableService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<TimetableService>(TimetableService);
  }); //before each

  it('Should do nothing tbh', async () => {
    //Arrange
    //Act
    //Assert
  });
}); //Timetable Service
