import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  mockDbResult,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
import { BuildingService } from './building.service';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../db/database.service';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import {
  createMockUniversityService,
  createMockVenueService,
} from 'src/Testing/Mocks/services';
import { VenueService } from 'src/Venue/venue.service';
import {
  BaseBuildingDto,
  CreateBuildingInput,
  UpdateBuildingInput,
} from './dto/building.dto';
import { uniId } from 'src/Testing/constants';
import { UniversityService } from 'src/University/university.service';
import { createBuilding, createVenue } from 'src/Testing/Factories';

export const DEFAULT_DISPLAY_COLOUR = '#808080';

describe('BuildingService', () => {
  let service: BuildingService;

  const { mockDb, reset: resetDatabase } = createMockDatabase();
  const { mockUniversityService, reset: resetUni } =
    createMockUniversityService();
  const { mockVenueService, reset: resetVenue } = createMockVenueService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BuildingService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: UniversityService, useValue: mockUniversityService },
        { provide: VenueService, useValue: mockVenueService },
      ],
    }).compile();

    service = module.get(BuildingService);
  });

  afterEach(() => {
    resetDatabase();
    resetUni();
    resetVenue();
    jest.clearAllMocks();
  });

  //Create
  describe('Test_create', () => {
    const input: CreateBuildingInput = {
      BuildingName: 'IT Building',
      UniversityID: uniId,
      location: { lat: -25.7545, lng: 28.2314 },
      footprint: null,
      icon: null,
      displayColour: '#808080',
      CreatedBy: 'user-1',
    };

    it('should create a building and return it', async () => {
      //Arrange
      const building = createBuilding();
      jest
        .spyOn(service as any, 'validateCreateBuildingInput')
        .mockResolvedValueOnce(input);
      mockTransaction(mockDb, { insert: [[building]] });

      //Act
      const result = await service.create(input);

      //Assert
      expect(result).toEqual({ building, venues: [] });
    });

    it('should throw InternalServerErrorException when insert returns no row', async () => {
      //Arrange
      jest
        .spyOn(service as any, 'validateCreateBuildingInput')
        .mockResolvedValueOnce(input);
      mockTransaction(mockDb, { insert: [[]] });

      //Act + Assert
      await expect(service.create(input)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should pass validated input to the insert', async () => {
      //Arrange
      const building = createBuilding();
      jest
        .spyOn(service as any, 'validateCreateBuildingInput')
        .mockResolvedValueOnce(input);
      mockTransaction(mockDb, { insert: [[building]] });

      //Act
      await service.create(input);

      //Assert
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
    });
  }); //END_Test_create

  //GetByid
  describe('Test_getById', () => {
    it('should throw NotFoundException if building does not exist', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act + Assert
      await expect(service.getById(uniId, 'building-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return building with its venues', async () => {
      //Arrange
      const building = createBuilding();
      const venues = [
        createVenue({
          VenueID: 'venue-1',
          VenueName: 'IT 2-26',
          BuildingID: building.BuildingID,
          UniversityID: uniId,
        }),
        createVenue({
          VenueID: 'venue-2',
          VenueName: 'IT 2-27',
          BuildingID: building.BuildingID,
          UniversityID: uniId,
        }),
      ];
      mockDbResult(mockDb.select, [building]);
      jest
        .spyOn(mockVenueService, 'getAllVenues')
        .mockResolvedValueOnce({ venues });

      //Act
      const result = await service.getById(uniId, building.BuildingID);

      //Assert
      expect(result).toEqual({ building, venues });
    });

    it('should return empty venues array when building has none', async () => {
      //Arrange
      const building = createBuilding();
      mockDbResult(mockDb.select, [building]);
      jest
        .spyOn(mockVenueService, 'getAllVenues')
        .mockResolvedValueOnce({ venues: [] });

      //Act
      const result = await service.getById(uniId, building.BuildingID);

      //Assert
      expect(result).toEqual({ building, venues: [] });
    });

    it('should query venues filtered by the building id', async () => {
      //Arrange
      const building = createBuilding();
      mockDbResult(mockDb.select, [building]);
      const spy = jest
        .spyOn(mockVenueService, 'getAllVenues')
        .mockResolvedValueOnce({ venues: [] });

      //Act
      await service.getById(uniId, building.BuildingID);

      //Assert
      expect(spy).toHaveBeenCalledWith(uniId, {
        buildingId: building.BuildingID,
      });
    });
  }); //END_Test_getById

  //GetAll
  describe('Test_getAll', () => {
    it('should return empty array when no buildings match', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await service.getAll(uniId, {});

      //Assert
      expect(result).toEqual({ buildings: [] });
    });

    it('should return buildings mapped with venue counts', async () => {
      //Arrange
      const building = createBuilding();
      mockDbResult(mockDb.select, [{ building, venueCount: 3 }]);

      //Act
      const result = await service.getAll(uniId, {});

      //Assert
      expect(result.buildings).toHaveLength(1);
      expect(result.buildings[0]).toMatchObject({
        BuildingID: building.BuildingID,
        BuildingName: building.BuildingName,
        venueCount: 3,
      });
    });

    it('should apply mapped=true filter', async () => {
      //Arrange
      const building = createBuilding({
        Latitude: -25.7545,
        Longitude: 28.2314,
      });
      mockDbResult(mockDb.select, [{ building, venueCount: 0 }]);

      //Act
      const result = await service.getAll(uniId, { mapped: true });

      //Assert
      expect(result.buildings).toHaveLength(1);
      expect(mockDb.select).toHaveBeenCalledTimes(1);
    });

    it('should apply mapped=false filter', async () => {
      //Arrange
      const building = createBuilding({ Latitude: null, Longitude: null });
      mockDbResult(mockDb.select, [{ building, venueCount: 0 }]);

      //Act
      const result = await service.getAll(uniId, { mapped: false });

      //Assert
      expect(result.buildings).toHaveLength(1);
      expect(mockDb.select).toHaveBeenCalledTimes(1);
    });

    it('should apply search filter', async () => {
      //Arrange
      const building = createBuilding({ BuildingName: 'IT Building' });
      mockDbResult(mockDb.select, [{ building, venueCount: 0 }]);

      //Act
      const result = await service.getAll(uniId, { search: 'IT' });

      //Assert
      expect(result.buildings).toHaveLength(1);
      expect(mockDb.select).toHaveBeenCalledTimes(1);
    });

    it('should map location from Latitude and Longitude columns', async () => {
      //Arrange
      const building = createBuilding({
        Latitude: -25.7545,
        Longitude: 28.2314,
      });
      mockDbResult(mockDb.select, [{ building, venueCount: 0 }]);

      //Act
      const result = await service.getAll(uniId, {});

      //Assert
      expect(result.buildings[0].location).toEqual({
        lat: -25.7545,
        lng: 28.2314,
      });
    });

    it('should map location to null when Latitude is null', async () => {
      //Arrange
      const building = createBuilding({ Latitude: null, Longitude: 28.2314 });
      mockDbResult(mockDb.select, [{ building, venueCount: 0 }]);

      //Act
      const result = await service.getAll(uniId, {});

      //Assert
      expect(result.buildings[0].location).toBeNull();
    });

    it('should map location to null when Longitude is null', async () => {
      //Arrange
      const building = createBuilding({ Latitude: -25.7545, Longitude: null });
      mockDbResult(mockDb.select, [{ building, venueCount: 0 }]);

      //Act
      const result = await service.getAll(uniId, {});

      //Assert
      expect(result.buildings[0].location).toBeNull();
    });
  }); //END_Test_getAll

  //Update
  describe('Test_update', () => {
    const input: UpdateBuildingInput = {};

    it('should throw NotFoundException if building does not exist', async () => {
      //Arrange
      mockTransaction(mockDb, {
        select: [[]],
      });

      //Act + Assert
      await expect(service.update(uniId, 'building-1', input)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return old building when no fields to update', async () => {
      //Arrange
      const building = createBuilding();
      mockTransaction(mockDb, {
        select: [[building]],
      });
      jest
        .spyOn(mockVenueService, 'getAllVenues')
        .mockResolvedValue({ venues: [] });
      jest
        .spyOn(service as any, 'validateUpdateBuildingInput')
        .mockResolvedValueOnce({});

      //Act
      const result = await service.update(uniId, building.BuildingID, {});

      //Assert
      expect(result.building).toEqual(building);
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should update building and return updated row', async () => {
      //Arrange
      const building = createBuilding();
      const updated = { ...building, BuildingName: 'New Name' };
      mockTransaction(mockDb, {
        select: [[building]],
      });
      jest
        .spyOn(mockVenueService, 'getAllVenues')
        .mockResolvedValue({ venues: [] });
      jest
        .spyOn(service as any, 'validateUpdateBuildingInput')
        .mockResolvedValueOnce({ BuildingName: 'New Name' });
      mockDbResult(mockDb.update, [updated]);

      //Act
      const result = await service.update(uniId, building.BuildingID, {
        BuildingName: 'New Name',
      });

      //Assert
      expect(result.building).toEqual(updated);
      expect(mockDb.update).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerErrorException when update returns no row', async () => {
      //Arrange
      const building = createBuilding();
      mockTransaction(mockDb, {
        select: [[building]],
      });
      jest
        .spyOn(mockVenueService, 'getAllVenues')
        .mockResolvedValue({ venues: [] });
      jest
        .spyOn(service as any, 'validateUpdateBuildingInput')
        .mockResolvedValueOnce({ BuildingName: 'New Name' });
      mockDbResult(mockDb.update, []);

      //Act + Assert
      await expect(
        service.update(uniId, building.BuildingID, {
          BuildingName: 'New Name',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  }); //END_Test_update

  //Delete
  describe('Test_delete', () => {
    it('should throw NotFoundException when delete returns no row', async () => {
      //Arrange
      mockDbResult(mockDb.delete, []);

      //Act + Assert
      await expect(service.delete('building-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return deleted building', async () => {
      //Arrange
      const building = createBuilding();
      mockDbResult(mockDb.delete, [building]);

      //Act
      const result = await service.delete(building.BuildingID);

      //Assert
      expect(result).toEqual({ building });
    });
  });

  //Helpers
  describe('Test_validateCreateBuildingInput', () => {
    const input: CreateBuildingInput = {
      BuildingName: 'IT Building',
      UniversityID: uniId,
      location: null,
      footprint: null,
      icon: null,
      displayColour: null,
    };

    it('should throw NotFoundException if university does not exist', async () => {
      //Arrange
      jest
        .spyOn(mockUniversityService, 'getById')
        .mockRejectedValueOnce(new NotFoundException('University not found'));

      //Act + Assert
      await expect(
        (service as any).validateCreateBuildingInput(input, mockDb),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if building name already exists', async () => {
      //Arrange
      jest
        .spyOn(mockUniversityService, 'getById')
        .mockResolvedValueOnce(undefined as any);
      mockDbResult(mockDb.select, [{ BuildingID: 'building-1' }]);

      //Act + Assert
      await expect(
        (service as any).validateCreateBuildingInput(input, mockDb),
      ).rejects.toThrow(ConflictException);
    });

    it('should default location, footprint and icon to null when absent', async () => {
      //Arrange
      jest
        .spyOn(mockUniversityService, 'getById')
        .mockResolvedValueOnce(undefined as any);
      mockDbResult(mockDb.select, []);
      const sparse = {
        BuildingName: 'IT Building',
        UniversityID: uniId,
      } as CreateBuildingInput;

      //Act
      const result = await (service as any).validateCreateBuildingInput(
        sparse,
        mockDb,
      );

      //Assert
      expect(result.location).toBeNull();
      expect(result.footprint).toBeNull();
      expect(result.icon).toBeNull();
    });

    it('should trim icon and null it out when empty', async () => {
      //Arrange
      jest
        .spyOn(mockUniversityService, 'getById')
        .mockResolvedValueOnce(undefined as any);
      mockDbResult(mockDb.select, []);
      const withBlankIcon = { ...input, icon: '   ' };

      //Act
      const result = await (service as any).validateCreateBuildingInput(
        withBlankIcon,
        mockDb,
      );

      //Assert
      expect(result.icon).toBeNull();
    });

    it('should default DisplayColour when absent', async () => {
      //Arrange
      jest
        .spyOn(mockUniversityService, 'getById')
        .mockResolvedValueOnce(undefined as any);
      mockDbResult(mockDb.select, []);
      const sparse = {
        BuildingName: 'IT Building',
        UniversityID: uniId,
      } as CreateBuildingInput;

      //Act
      const result = await (service as any).validateCreateBuildingInput(
        sparse,
        mockDb,
      );

      //Assert
      expect(result.displayColour).toBe(DEFAULT_DISPLAY_COLOUR);
    });
  }); //END_Test_validateCreateBuildingInput

  describe('Test_uniqueBuildingNamePerUniversity', () => {
    it('should return null when no building found', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await (service as any).uniqueBuildingNamePerUniversity(
        'IT Building',
        uniId,
        mockDb,
      );

      //Assert
      expect(result).toBeNull();
    });

    it('should return the building wrapped in a response when found', async () => {
      //Arrange
      const building = createBuilding();
      mockDbResult(mockDb.select, [building]);

      //Act
      const result = await (service as any).uniqueBuildingNamePerUniversity(
        building.BuildingName,
        uniId,
        mockDb,
      );

      //Assert
      expect(result).toEqual({ building });
    });
  }); //END_Test_uniqueBuildingNamePerUniversity

  describe('Test_validateUpdateBuildingInput', () => {
    const oldBuilding: BaseBuildingDto = {
      BuildingID: 'building-1',
      BuildingName: 'IT Building',
      UniversityID: uniId,
      location: { lat: -25.7545, lng: 28.2314 },
      footprint: null,
      icon: 'school',
      displayColour: '#4A5548',
    };

    it('should delete BuildingName when undefined', async () => {
      //Arrange
      const input: UpdateBuildingInput = {};

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect('BuildingName' in result).toBe(false);
    });

    it('should delete BuildingName when same as old', async () => {
      //Arrange
      const input: UpdateBuildingInput = {
        BuildingName: oldBuilding.BuildingName,
      };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect('BuildingName' in result).toBe(false);
    });

    it('should throw ConflictException when new BuildingName is taken by another building', async () => {
      //Arrange
      const input: UpdateBuildingInput = { BuildingName: 'Other Building' };
      mockDbResult(mockDb.select, [
        { BuildingID: 'building-2', BuildingName: 'Other Building' },
      ]);

      //Act + Assert
      await expect(
        (service as any).validateUpdateBuildingInput(
          oldBuilding,
          input,
          mockDb,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should keep BuildingName when changed and unique', async () => {
      //Arrange
      const input: UpdateBuildingInput = { BuildingName: 'New Name' };
      mockDbResult(mockDb.select, []);

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect(result.BuildingName).toBe('New Name');
    });

    it('should delete location when undefined', async () => {
      //Arrange
      const input: UpdateBuildingInput = {};

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect('location' in result).toBe(false);
    });

    it('should delete location when null and old is also null', async () => {
      //Arrange
      const input: UpdateBuildingInput = { location: null };
      const old = { ...oldBuilding, location: null };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        old,
        input,
        mockDb,
      );

      //Assert
      expect('location' in result).toBe(false);
    });

    it('should keep location null when unpinning', async () => {
      //Arrange
      const input: UpdateBuildingInput = { location: null };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect(result.location).toBeNull();
    });

    it('should delete location when same as old', async () => {
      //Arrange
      const input: UpdateBuildingInput = { location: oldBuilding.location };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect('location' in result).toBe(false);
    });

    it('should keep location when changed', async () => {
      //Arrange
      const input: UpdateBuildingInput = { location: { lat: -26, lng: 29 } };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect(result.location).toEqual({ lat: -26, lng: 29 });
    });

    it('should delete icon when same as old', async () => {
      //Arrange
      const input: UpdateBuildingInput = { icon: oldBuilding.icon };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect('icon' in result).toBe(false);
    });

    it('should delete icon when empty after trim', async () => {
      //Arrange
      const input: UpdateBuildingInput = { icon: '   ' };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect('icon' in result).toBe(false);
    });

    it('should trim and keep icon when changed', async () => {
      //Arrange
      const input: UpdateBuildingInput = { icon: '  library  ' };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect(result.icon).toBe('library');
    });

    it('should delete DisplayColour when same as old', async () => {
      //Arrange
      const input: UpdateBuildingInput = {
        displayColour: oldBuilding.displayColour,
      };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect('displayColour' in result).toBe(false);
    });

    it('should keep DisplayColour when changed', async () => {
      //Arrange
      const input: UpdateBuildingInput = { displayColour: '#ABCDEF' };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect(result.displayColour).toBe('#ABCDEF');
    });

    // BuildingName
    it('should keep BuildingName when duplicate found with same ID (self-match)', async () => {
      //Arrange
      const input: UpdateBuildingInput = { BuildingName: 'New Name' };
      mockDbResult(mockDb.select, [
        { BuildingID: oldBuilding.BuildingID, BuildingName: 'New Name' },
      ]);

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect(result.BuildingName).toBe('New Name');
    });

    // Location
    it('should keep location when old is null and new location provided', async () => {
      //Arrange
      const old = { ...oldBuilding, location: null };
      const input: UpdateBuildingInput = { location: { lat: -26, lng: 29 } };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        old,
        input,
        mockDb,
      );

      //Assert
      expect(result.location).toEqual({ lat: -26, lng: 29 });
    });

    // Footprint
    it('should delete footprint when undefined', async () => {
      //Arrange
      const input: UpdateBuildingInput = {};

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect('footprint' in result).toBe(false);
    });

    it('should delete footprint when null and old is also null', async () => {
      //Arrange
      const input: UpdateBuildingInput = { footprint: null };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect('footprint' in result).toBe(false);
    });

    it('should keep footprint null when clearing', async () => {
      //Arrange
      const old = {
        ...oldBuilding,
        footprint: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [28.2, -25.7],
              [28.3, -25.7],
              [28.3, -25.8],
              [28.2, -25.7],
            ],
          ],
        },
      };
      const input: UpdateBuildingInput = { footprint: null };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        old,
        input,
        mockDb,
      );

      //Assert
      expect(result.footprint).toBeNull();
    });

    it('should delete footprint when same as old', async () => {
      //Arrange
      const footprint = {
        type: 'Polygon' as const,
        coordinates: [
          [
            [28.2, -25.7],
            [28.3, -25.7],
            [28.3, -25.8],
            [28.2, -25.7],
          ],
        ] as [number, number][][],
      };
      const old = { ...oldBuilding, footprint };
      const input: UpdateBuildingInput = { footprint };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        old,
        input,
        mockDb,
      );

      //Assert
      expect('footprint' in result).toBe(false);
    });

    it('should keep footprint when changed', async () => {
      //Arrange
      const input: UpdateBuildingInput = {
        footprint: {
          type: 'Polygon',
          coordinates: [
            [
              [28.2, -25.7],
              [28.3, -25.7],
              [28.3, -25.8],
              [28.2, -25.7],
            ],
          ],
        },
      };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect(result.footprint).toEqual(input.footprint);
    });

    // Icon
    it('should delete icon when undefined', async () => {
      //Arrange
      const input: UpdateBuildingInput = {};

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect('icon' in result).toBe(false);
    });

    it('should delete icon when null and old is also null', async () => {
      //Arrange
      const old = { ...oldBuilding, icon: null };
      const input: UpdateBuildingInput = { icon: null };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        old,
        input,
        mockDb,
      );

      //Assert
      expect('icon' in result).toBe(false);
    });

    it('should keep icon null when clearing an existing icon', async () => {
      //Arrange
      const input: UpdateBuildingInput = { icon: null };

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect(result.icon).toBeNull();
    });

    // DisplayColour
    it('should delete DisplayColour when undefined', async () => {
      //Arrange
      const input: UpdateBuildingInput = {};

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect('displayColour' in result).toBe(false);
    });
  }); //END_Test_validateUpdateBuildingInput
});
