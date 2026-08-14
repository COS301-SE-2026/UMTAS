import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { mockDbResult } from '../Testing/Mocks/database.helpers';
import { BuildingService } from './building.service';
import { SessionData } from 'src/auth/session.decorator';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../db/database.service';
import { ConflictException, ForbiddenException } from '@nestjs/common';

describe('BuildingService', () => {
  let buildingService: BuildingService;

  const { mockDb, reset: resetDatabase } = createMockDatabase();

  const mockSession: SessionData = {
    session: {
      id: 'jan-session',
      createdAt: '',
      expiresAt: '',
      token: '',
      updatedAt: '',
      userId: 'janneman-123',
    },
    user: {
      id: 'janneman-123',
      email: 'janbokkie@boertjie.com',
      banned: false,
      createdAt: 'home',
      emailVerified: true,
      name: 'Jan Bloukaas',
      role: 'user',
      updatedAt: 'uni',
    },
    uniId: 'pretoria-bru-123',
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BuildingService,
        { provide: DatabaseService, useValue: { db: mockDb } },
      ],
    }).compile();

    buildingService = module.get(BuildingService);
  });

  afterEach(() => {
    resetDatabase();
  });

  describe('test_getAllBuildings', () => {
    it('should throw ForbiddenException if there is no active sessions', async () => {
      await expect(
        buildingService.getAllBuildings(null as any, {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  it('should return list of all the mapped buildings', async () => {
    const mockData = [
      {
        building: {
          BuildingID: 'up-build-1',
          BuildingName: 'Chancellors',
          Latitude: 67.67,
          Longitude: -67.67,
          Footprint: null,
          Icon: 'iconic',
          DisplayColour: 'blue',
        },
        venueCount: 3,
      },
    ];

    mockDbResult(mockDb.select, mockData);

    const result = await buildingService.getAllBuildings(mockSession, {
      mapped: true,
    });

    expect(result).toMatchObject({
      buildings: [
        {
          buildingId: 'up-build-1',
          buildingName: 'Chancellors',
          venueCount: 3,
        },
      ],
    });
  });

  describe('test_CreateBuilding', () => {
    it('should throw ConflictException if the name of the building already exists', async () => {
      mockDbResult(mockDb.select, [{ id: 'id-bru' }]);

      await expect(
        buildingService.createBuilding(mockSession, {
          buildingName: 'IT building my favourite',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
