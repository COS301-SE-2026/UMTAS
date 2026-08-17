import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { mockDbResult } from '../Testing/Mocks/database.helpers';
import { VenueService } from './venue.service';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../db/database.service';

import { SessionData } from '../auth/session.decorator';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('VenueService', () => {
  let venueService: VenueService;

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
        VenueService,
        { provide: DatabaseService, useValue: { db: mockDb } },
      ],
    }).compile();

    venueService = module.get(VenueService);
  });

  afterEach(() => {
    resetDatabase();
  });

  describe('getAllVenues', () => {
    it('should throw ForbiddenException if no active session', async () => {
      await expect(venueService.getAllVenues(null as any, {})).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if no university is selected', async () => {
      const noUniversitySession = { ...mockSession, uniId: undefined } as any;

      await expect(
        venueService.getAllVenues(noUniversitySession, {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return venues joined with their building, including unmapped ones', async () => {
      const mockRows = [
        {
          venueId: 'venue-1',
          venueName: 'IT 2-26',
          buildingId: 'building-1',
          buildingName: 'IT Building',
        },
        {
          venueId: 'venue-2',
          venueName: 'Thuto 1-1',
          buildingId: null,
          buildingName: null,
        },
      ];

      mockDbResult(mockDb.select, mockRows);

      const result = await venueService.getAllVenues(mockSession, {});

      expect(result).toEqual({ venues: mockRows });
    });

    it('should not filter out unmapped venues when "mapped" is omitted', async () => {
      const mockRows = [
        {
          venueId: 'venue-1',
          venueName: 'IT 2-26',
          buildingId: 'building-1',
          buildingName: 'IT Building',
        },
      ];

      mockDbResult(mockDb.select, mockRows);

      const result = await venueService.getAllVenues(mockSession, {});

      expect(result.venues).toHaveLength(1);
      expect(result.venues[0].buildingId).not.toBeNull();
    });
  });

  describe('assignBuilding', () => {
    it('should throw NotFoundException if the venue does not belong to the selected university', async () => {
      mockDbResult(mockDb.select, []);

      await expect(
        venueService.assignBuilding(mockSession, 'venue-1', {
          buildingId: 'building-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if the building belongs to a different university', async () => {
      mockDbResult(mockDb.select, [{ VenueID: 'venue-1' }]);
      mockDbResult(mockDb.select, []);

      await expect(
        venueService.assignBuilding(mockSession, 'venue-1', {
          buildingId: 'wits-building',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should assign the building and return the updated mapping', async () => {
      mockDbResult(mockDb.select, [{ VenueID: 'venue-1' }]);
      mockDbResult(mockDb.select, [{ id: 'building-1' }]);
      mockDbResult(mockDb.update, [{ VenueID: 'venue-1' }]);
      mockDbResult(mockDb.select, [
        {
          venueId: 'venue-1',
          venueName: 'IT 2-26',
          buildingId: 'building-1',
          buildingName: 'IT Building',
        },
      ]);

      const result = await venueService.assignBuilding(mockSession, 'venue-1', {
        buildingId: 'building-1',
      });

      expect(result).toMatchObject({
        venueId: 'venue-1',
        buildingId: 'building-1',
        buildingName: 'IT Building',
      });
    });

    it('should allow unassigning a venue by sending a null buildingId', async () => {
      mockDbResult(mockDb.select, [{ VenueID: 'venue-1' }]);
      mockDbResult(mockDb.update, [{ VenueID: 'venue-1' }]);
      mockDbResult(mockDb.select, [
        {
          venueId: 'venue-1',
          venueName: 'IT 2-26',
          buildingId: null,
          buildingName: null,
        },
      ]);

      const result = await venueService.assignBuilding(mockSession, 'venue-1', {
        buildingId: null,
      });

      expect(result.buildingId).toBeNull();
    });
  });

  describe('bulkAssign', () => {
    it('should throw BadRequestException if any building belongs to a different university', async () => {
      mockDbResult(mockDb.select, [{ id: 'building-1' }]);

      await expect(
        venueService.bulkAssign(mockSession, {
          assignments: [
            { venueId: 'venue-1', buildingId: 'building-1' },
            { venueId: 'venue-2', buildingId: 'wits-building' },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should skip the building ownership check entirely when every assignment gets unassigned', async () => {
      const result = await venueService.bulkAssign(mockSession, {
        assignments: [
          { venueId: 'venue-1', buildingId: null },
          { venueId: 'venue-2', buildingId: null },
        ],
      });

      expect(result).toEqual({ updated: 2, success: true });
    });

    it('should update every row inside a transaction and report the count', async () => {
      mockDbResult(mockDb.select, [{ id: 'building-1' }]);

      const result = await venueService.bulkAssign(mockSession, {
        assignments: [
          { venueId: 'venue-1', buildingId: 'building-1' },
          { venueId: 'venue-2', buildingId: 'building-1' },
        ],
      });

      expect(result).toEqual({ updated: 2, success: true });
    });
  });
});
