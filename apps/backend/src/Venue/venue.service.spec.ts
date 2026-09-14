import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  mockDbResult,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
import { VenueService } from './venue.service';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../db/database.service';

import {
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  createMockUniversityService,
  createMockBuildingService,
} from 'src/Testing/Mocks/services';

import { UniversityService } from 'src/University/university.service';
import { BuildingService } from 'src/Building/building.service';
import { uniId, venueId } from 'src/Testing/constants';
import { createVenue } from 'src/Testing/Factories';
import {
  BaseVenueDto,
  UpdateVenueInput,
  VenueSingleResponseDto,
} from './dto/venue.dto';
describe('VenueService', () => {
  let service: VenueService;

  const { mockDb, reset: resetDatabase } = createMockDatabase();
  const { mockUniversityService, reset: resetUni } =
    createMockUniversityService();
  const { mockBuildingService, reset: resetBuilding } =
    createMockBuildingService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        VenueService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: UniversityService, useValue: mockUniversityService },
        { provide: BuildingService, useValue: mockBuildingService },
      ],
    }).compile();

    service = module.get(VenueService);
  });

  afterEach(() => {
    resetDatabase();
    resetUni();
    resetBuilding();
    jest.restoreAllMocks();
  });

  describe('Test_create', () => {
    const validInput = {
      VenueName: 'Main Lecture Hall',
      UniversityID: 'pretoria-bru-123',
      BuildingID: null,
    };

    const newVenue = {
      VenueID: 'venue-1',
      VenueName: 'Main Lecture Hall',
      UniversityID: 'pretoria-bru-123',
      BuildingID: null,
    };

    //Happy - create new venue
    it('should create a venue when the input is valid', async () => {
      // Arrange
      mockTransaction(mockDb, {
        select: [
          [], //no duplicate name
        ],
        insert: [[newVenue]],
      });

      // Act
      const result = await service.create(validInput);

      // Assert
      expect(result.venue.VenueID).toBe('venue-1');
    });

    it('should throw NotFoundException when the university does not exist', async () => {
      // Arrange
      jest
        .spyOn(mockUniversityService, 'getById')
        .mockRejectedValueOnce(new NotFoundException('University not found'));
      mockTransaction(mockDb, {});

      // Act + Assert
      await expect(service.create(validInput)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when the building does not exist', async () => {
      // Arrange
      const inputWithBuilding = {
        ...validInput,
        BuildingID: 'building-1',
      };
      jest
        .spyOn(mockUniversityService, 'getById')
        .mockResolvedValueOnce(undefined as any);
      jest
        .spyOn(mockBuildingService, 'getById')
        .mockRejectedValueOnce(new NotFoundException('Building not found'));
      mockTransaction(mockDb, {});

      // Act + Assert
      await expect(service.create(inputWithBuilding)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when a venue with the same name exists for the university', async () => {
      // Arrange
      mockTransaction(mockDb, {
        select: [
          [newVenue], //conflict
        ],
      });

      // Act + Assert
      await expect(service.create(validInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should default BuildingID to null when not provided', async () => {
      // Arrange
      const inputWithoutBuilding = {
        VenueName: 'Main Lecture Hall',
        UniversityID: 'pretoria-bru-123',
      };

      mockTransaction(mockDb, {
        select: [
          [], //no duplicate
        ],
        insert: [[newVenue]],
      });

      // Act
      const result = await service.create(inputWithoutBuilding);

      // Assert
      expect(result.venue.BuildingID).toBeNull();
    });

    it('should throw InternalServerErrorException when the insert returns no row', async () => {
      // Arrange
      mockTransaction(mockDb, {
        select: [
          [], //no duplicate
        ],
        insert: [
          [], //insert failed
        ],
      });

      // Act + Assert
      await expect(service.create(validInput)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  }); //END_Test_create

  describe('Test_getById', () => {
    it('should throw if venue not found', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act + Assert
      await expect(service.getById(venueId)).rejects.toThrow(NotFoundException);
    });

    it('should return venue found', async () => {
      //Arrange
      const venue = createVenue();
      mockDbResult(mockDb.select, [venue]);

      const expected: VenueSingleResponseDto = { venue };

      //Act
      const result = await service.getById(venueId);

      //Assert
      expect(result).toMatchObject(expected);
    });
  }); //END_Test_getById

  describe('Test_getAllVenues', () => {
    it('should return all venues when no filters provided', async () => {
      //Arrange
      const venues = [
        {
          VenueID: 'venue-1',
          VenueName: 'IT 2-26',
          BuildingID: 'building-1',
          UniversityID: uniId,
        },
        {
          VenueID: 'venue-2',
          VenueName: 'Thuto 1-1',
          BuildingID: null,
          UniversityID: uniId,
        },
      ];
      mockDbResult(mockDb.select, venues);

      //Act
      const result = await service.getAllVenues(uniId, {});

      //Assert
      expect(result).toEqual({ venues });
    });

    it('should return empty array when university has no venues', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await service.getAllVenues(uniId, {});

      //Assert
      expect(result).toEqual({ venues: [] });
    });

    it('should apply buildingId, mapped=true and search filters together', async () => {
      //Arrange
      const venues = [
        {
          VenueID: 'venue-1',
          VenueName: 'IT 2-26',
          BuildingID: 'building-1',
          UniversityID: uniId,
        },
      ];
      mockDbResult(mockDb.select, venues);

      //Act
      const result = await service.getAllVenues(uniId, {
        buildingId: 'building-1',
        mapped: true,
        search: 'IT',
      });

      //Assert
      expect(result).toEqual({ venues });
      expect(mockDb.select).toHaveBeenCalledTimes(1);
    });

    it('should apply mapped=false filter', async () => {
      //Arrange
      const venues = [
        {
          VenueID: 'venue-2',
          VenueName: 'Thuto 1-1',
          BuildingID: null,
          UniversityID: uniId,
        },
      ];
      mockDbResult(mockDb.select, venues);

      //Act
      const result = await service.getAllVenues(uniId, { mapped: false });

      //Assert
      expect(result).toEqual({ venues });
    });
  }); //END_Test_getAllVenues

  describe('Test_update', () => {
    it('should throw NotFoundException when venue does not exist', async () => {
      //Arrange
      mockTransaction(mockDb, {
        select: [[]],
      });

      //Act + Assert
      await expect(
        service.update('venue-1', { UniversityID: uniId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return old venue when no fields to update', async () => {
      //Arrange
      const venue = createVenue();
      mockTransaction(mockDb, {
        select: [[venue]],
      });
      jest.spyOn(service as any, 'validateUpdateInput').mockResolvedValue({});

      //Act
      const result = await service.update(venue.VenueID, {
        UniversityID: uniId,
      });

      //Assert
      expect(result).toEqual({ venue });
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should update venue with provided fields', async () => {
      //Arrange
      const venue = createVenue();
      const updated = { ...venue, VenueName: 'New Name' };
      mockTransaction(mockDb, {
        select: [[venue]],
      });
      jest
        .spyOn(service as any, 'validateUpdateInput')
        .mockResolvedValue({ VenueName: 'New Name' });
      mockDbResult(mockDb.update, [updated]);

      //Act
      const result = await service.update(venue.VenueID, {
        VenueName: 'New Name',
        UniversityID: uniId,
      });

      //Assert
      expect(result).toEqual({ venue: updated });
      expect(mockDb.update).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerErrorException when update returns no row', async () => {
      //Arrange
      const venue = createVenue();
      mockTransaction(mockDb, {
        select: [[venue]],
      });
      jest
        .spyOn(service as any, 'validateUpdateInput')
        .mockResolvedValue({ VenueName: 'New Name' });
      mockDbResult(mockDb.update, []);

      //Act + Assert
      await expect(
        service.update(venue.VenueID, {
          VenueName: 'New Name',
          UniversityID: uniId,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  }); //END_Test_update

  //delete
  describe('Test_delete', () => {
    it('should throw InternalServerErrorException when delete returns no row', async () => {
      //Arrange
      mockDbResult(mockDb.delete, []);

      //Act + Assert
      await expect(service.delete('venue-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should return deleted venue', async () => {
      //Arrange
      const venue = createVenue();
      mockDbResult(mockDb.delete, [venue]);

      //Act
      const result = await service.delete(venue.VenueID);

      //Assert
      expect(result).toEqual({ venue });
    });
  }); //END_Test_delete

  // describe('assignBuilding', () => {
  //   it('should throw NotFoundException if the venue does not belong to the selected university', async () => {
  //     mockDbResult(mockDb.select, []);

  //     await expect(
  //       service.assignBuilding(mockSession, 'venue-1', {
  //         buildingId: 'building-1',
  //       }),
  //     ).rejects.toThrow(NotFoundException);
  //   });

  //   it('should assign the building and return the updated mapping', async () => {
  //     mockDbResult(mockDb.select, [{ VenueID: 'venue-1' }]);
  //     mockDbResult(mockDb.select, [{ id: 'building-1' }]);
  //     mockDbResult(mockDb.update, [{ VenueID: 'venue-1' }]);
  //     mockDbResult(mockDb.select, [
  //       {
  //         venueId: 'venue-1',
  //         venueName: 'IT 2-26',
  //         buildingId: 'building-1',
  //         buildingName: 'IT Building',
  //       },
  //     ]);

  //     const result = await service.assignBuilding(mockSession, 'venue-1', {
  //       buildingId: 'building-1',
  //     });

  //     expect(result).toMatchObject({
  //       venueId: 'venue-1',
  //       buildingId: 'building-1',
  //       buildingName: 'IT Building',
  //     });
  //   });

  //   it('should allow unassigning a venue by sending a null buildingId', async () => {
  //     mockDbResult(mockDb.select, [{ VenueID: 'venue-1' }]);
  //     mockDbResult(mockDb.update, [{ VenueID: 'venue-1' }]);
  //     mockDbResult(mockDb.select, [
  //       {
  //         venueId: 'venue-1',
  //         venueName: 'IT 2-26',
  //         buildingId: null,
  //         buildingName: null,
  //       },
  //     ]);

  //     const result = await service.assignBuilding(mockSession, 'venue-1', {
  //       buildingId: null,
  //     });

  //     expect(result.buildingId).toBeNull();
  //   });
  // });

  // describe('bulkAssign', () => {
  //   it('should throw BadRequestException if any building belongs to a different university', async () => {
  //     mockDbResult(mockDb.select, [{ id: 'building-1' }]);

  //     await expect(
  //       service.bulkAssign(mockSession, {
  //         assignments: [
  //           { venueId: 'venue-1', buildingId: 'building-1' },
  //           { venueId: 'venue-2', buildingId: 'wits-building' },
  //         ],
  //       }),
  //     ).rejects.toThrow(BadRequestException);
  //   });

  //   it('should skip the building ownership check entirely when every assignment gets unassigned', async () => {
  //     const result = await service.bulkAssign(mockSession, {
  //       assignments: [
  //         { venueId: 'venue-1', buildingId: null },
  //         { venueId: 'venue-2', buildingId: null },
  //       ],
  //     });

  //     expect(result).toEqual({ updated: 2, success: true });
  //   });

  //   it('should update every row inside a transaction and report the count', async () => {
  //     mockDbResult(mockDb.select, [{ id: 'building-1' }]);
  //     mockTransaction(mockDb, {
  //       update: [[{ VenueID: 'venue-1' }], [{ VenueID: 'venue-2' }]],
  //     });

  //     const result = await service.bulkAssign(mockSession, {
  //       assignments: [
  //         { venueId: 'venue-1', buildingId: 'building-1' },
  //         { venueId: 'venue-2', buildingId: 'building-1' },
  //       ],
  //     });

  //     expect(result).toEqual({ updated: 2, success: true });
  //   });
  // });

  //validateUpdateInput
  describe('Test_validateUpdateInput', () => {
    const oldVenue: BaseVenueDto = {
      VenueID: 'venue-1',
      VenueName: 'IT 2-26',
      UniversityID: 'uni-1',
      BuildingID: 'building-1',
    };

    it('should delete BuildingID when undefined', async () => {
      //Arrange
      const input: UpdateVenueInput = {
        UniversityID: uniId,
      };

      //Act
      const result = await (service as any).validateUpdateInput(
        oldVenue,
        input,
        mockDb,
      );

      //Assert
      expect('BuildingID' in result).toBe(false);
    });

    it('should delete BuildingID when null and old is also null', async () => {
      //Arrange
      const input: UpdateVenueInput = {
        BuildingID: null,
        UniversityID: uniId,
      };
      const old: BaseVenueDto = { ...oldVenue, BuildingID: null };

      //Act
      const result = await (service as any).validateUpdateInput(
        old,
        input,
        mockDb,
      );

      //Assert
      expect('BuildingID' in result).toBe(false);
    });

    it('should keep BuildingID as null when unassigning', async () => {
      //Arrange
      const input: UpdateVenueInput = {
        BuildingID: null,
        UniversityID: uniId,
      };

      //Act
      const result = await (service as any).validateUpdateInput(
        oldVenue,
        input,
        mockDb,
      );

      //Assert
      expect(result.BuildingID).toBeNull();
    });

    it('should delete BuildingID when same as old', async () => {
      //Arrange
      const input: UpdateVenueInput = {
        BuildingID: oldVenue.BuildingID,
        UniversityID: uniId,
      };

      //Act
      const result = await (service as any).validateUpdateInput(
        oldVenue,
        input,
        mockDb,
      );

      //Assert
      expect('BuildingID' in result).toBe(false);
    });

    it('should validate and keep BuildingID when changed', async () => {
      //Arrange
      const input: UpdateVenueInput = {
        BuildingID: 'building-2',
        UniversityID: uniId,
      };
      const spy = jest
        .spyOn(mockBuildingService, 'getById')
        .mockResolvedValue(undefined as any);

      //Act
      const result = await (service as any).validateUpdateInput(
        oldVenue,
        input,
        mockDb,
      );

      //Assert
      expect(spy).toHaveBeenCalledWith('building-2', uniId, mockDb);
      expect(result.BuildingID).toBe('building-2');
    });

    it('should delete VenueName when undefined', async () => {
      //Arrange
      const input: UpdateVenueInput = { UniversityID: uniId };

      //Act
      const result = await (service as any).validateUpdateInput(
        oldVenue,
        input,
        mockDb,
      );

      //Assert
      expect('VenueName' in result).toBe(false);
    });

    it('should delete VenueName when same as old', async () => {
      //Arrange
      const input: UpdateVenueInput = {
        VenueName: oldVenue.VenueName,
        UniversityID: uniId,
      };

      //Act
      const result = await (service as any).validateUpdateInput(
        oldVenue,
        input,
        mockDb,
      );

      //Assert
      expect('VenueName' in result).toBe(false);
    });

    it('should throw ConflictException when new VenueName already taken', async () => {
      //Arrange
      const input: UpdateVenueInput = {
        VenueName: 'Thuto 1-1',
        UniversityID: uniId,
      };
      mockDbResult(mockDb.select, [{ VenueID: 'venue-2' }]);

      //Act + Assert
      await expect(
        (service as any).validateUpdateInput(oldVenue, input, mockDb),
      ).rejects.toThrow(ConflictException);
    });

    it('should keep VenueName when changed and unique', async () => {
      //Arrange
      const input: UpdateVenueInput = {
        VenueName: 'New Name',
        UniversityID: uniId,
      };
      mockDbResult(mockDb.select, []);

      //Act
      const result = await (service as any).validateUpdateInput(
        oldVenue,
        input,
        mockDb,
      );

      //Assert
      expect(result.VenueName).toBe('New Name');
    });
  }); //END_Test_validateUpdateInput
});
