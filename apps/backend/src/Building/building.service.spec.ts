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
import { CreateBuildingInput } from './dto/building.dto';
import { uniId } from 'src/Testing/constants';
import { UniversityService } from 'src/University/university.service';
import {
  createBuilding,
  createBuildingDto,
  createBuildingListResponse,
  createBuildingQueryDto,
  createBuildingSingleResponse,
  createCreateBuildingInput,
  createFootprint,
  createUpdateBuildingInput,
  createVenue,
} from 'src/Testing/Factories';

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
    it('should throw InternalServerErrorException when insert returns no row', async () => {
      //Arrange
      const input = createCreateBuildingInput();
      jest
        .spyOn(service as any, 'validateCreateBuildingInput')
        .mockResolvedValueOnce(input);
      mockTransaction(mockDb, { insert: [[]] });

      //Act + Assert
      await expect(service.create(input)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should create a building and return it', async () => {
      //Arrange
      const input = createCreateBuildingInput();
      const building = createBuilding({
        BuildingName: input.BuildingName,
        UniversityID: input.UniversityID,
        Latitude: input.location!.lat,
        Longitude: input.location!.lng,
      });
      jest
        .spyOn(service as any, 'validateCreateBuildingInput')
        .mockResolvedValueOnce(input);
      mockTransaction(mockDb, { insert: [[building]] });

      //Act
      const result = await service.create(input);

      //Assert
      expect(result).toEqual(
        createBuildingSingleResponse({
          building: createBuildingDto({
            BuildingID: building.BuildingID,
            BuildingName: building.BuildingName,
            UniversityID: building.UniversityID,
            location: { lat: building.Latitude!, lng: building.Longitude! },
            venueCount: 0,
          }),
          venues: [],
        }),
      );
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
        createVenue({ BuildingID: building.BuildingID, UniversityID: uniId }),
        createVenue({ BuildingID: building.BuildingID, UniversityID: uniId }),
      ];
      mockDbResult(mockDb.select, [building]);
      jest
        .spyOn(mockVenueService, 'getAllVenues')
        .mockResolvedValueOnce({ venues });

      //Act
      const result = await service.getById(uniId, building.BuildingID);

      //Assert
      expect(result).toEqual(
        createBuildingSingleResponse({
          building: createBuildingDto({
            BuildingID: building.BuildingID,
            BuildingName: building.BuildingName,
            UniversityID: building.UniversityID,
            location: { lat: building.Latitude!, lng: building.Longitude! },
            venueCount: 2,
          }),
          venues,
        }),
      );
    });
  }); //END_Test_getById

  //GetAll
  describe('Test_getAll', () => {
    it('should return empty array when no buildings match', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await service.getAll(uniId, createBuildingQueryDto());

      //Assert
      expect(result).toEqual({ buildings: [] });
    });

    it('should apply mapped=true filter', async () => {
      //Arrange
      const building = createBuilding();
      mockDbResult(mockDb.select, [{ building, venueCount: 0 }]);

      //Act
      const result = await service.getAll(
        uniId,
        createBuildingQueryDto({ mapped: true }),
      );

      //Assert
      expect(result).toEqual(
        createBuildingListResponse({
          buildings: [
            createBuildingDto({
              BuildingID: building.BuildingID,
              BuildingName: building.BuildingName,
              UniversityID: building.UniversityID,
              location: { lat: building.Latitude!, lng: building.Longitude! },
              venueCount: 0,
            }),
          ],
        }),
      );
      expect(mockDb.select).toHaveBeenCalledTimes(1);
    });

    it('should apply mapped=false filter', async () => {
      //Arrange
      const building = createBuilding({ Latitude: null, Longitude: null });
      mockDbResult(mockDb.select, [{ building, venueCount: 0 }]);

      //Act
      const result = await service.getAll(
        uniId,
        createBuildingQueryDto({ mapped: false }),
      );

      //Assert
      expect(result).toEqual(
        createBuildingListResponse({
          buildings: [
            createBuildingDto({
              BuildingID: building.BuildingID,
              BuildingName: building.BuildingName,
              UniversityID: building.UniversityID,
              location: null,
              venueCount: 0,
            }),
          ],
        }),
      );
      expect(mockDb.select).toHaveBeenCalledTimes(1);
    });

    it('should apply search filter', async () => {
      //Arrange
      const building = createBuilding({ BuildingName: 'IT Building' });
      mockDbResult(mockDb.select, [{ building, venueCount: 0 }]);

      //Act
      const result = await service.getAll(
        uniId,
        createBuildingQueryDto({ search: 'IT' }),
      );

      //Assert
      expect(result).toEqual(
        createBuildingListResponse({
          buildings: [
            createBuildingDto({
              BuildingID: building.BuildingID,
              BuildingName: 'IT Building',
              UniversityID: building.UniversityID,
              location: { lat: building.Latitude!, lng: building.Longitude! },
              venueCount: 0,
            }),
          ],
        }),
      );
      expect(mockDb.select).toHaveBeenCalledTimes(1);
    });
  }); //END_Test_getAll

  //Update
  describe('Test_update', () => {
    it('should throw InternalServerErrorException when update returns no row', async () => {
      //Arrange
      const input = createUpdateBuildingInput({ BuildingName: 'New Name' });
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
        service.update(uniId, building.BuildingID, input),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should return old building when no fields to update', async () => {
      //Arrange
      const input = createUpdateBuildingInput();
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
      const result = await service.update(uniId, building.BuildingID, input);

      //Assert
      expect(result).toEqual(
        createBuildingSingleResponse({
          building: createBuildingDto({
            BuildingID: building.BuildingID,
            BuildingName: building.BuildingName,
            UniversityID: building.UniversityID,
            location: { lat: building.Latitude!, lng: building.Longitude! },
            venueCount: 0,
          }),
        }),
      );
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should update building and return updated row', async () => {
      //Arrange
      const input = createUpdateBuildingInput({ BuildingName: 'New Name' });
      const building = createBuilding();
      const updated = createBuilding({ ...building, BuildingName: 'New Name' });
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
      const result = await service.update(uniId, building.BuildingID, input);

      //Assert
      expect(result).toEqual(
        createBuildingSingleResponse({
          building: createBuildingDto({
            BuildingID: updated.BuildingID,
            BuildingName: 'New Name',
            UniversityID: updated.UniversityID,
            location: { lat: updated.Latitude!, lng: updated.Longitude! },
            venueCount: 0,
          }),
        }),
      );
      expect(mockDb.update).toHaveBeenCalledTimes(1);
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
      expect(result).toEqual(
        createBuildingSingleResponse({
          building: createBuildingDto({
            BuildingID: building.BuildingID,
            BuildingName: building.BuildingName,
            UniversityID: building.UniversityID,
            location: { lat: building.Latitude!, lng: building.Longitude! },
            venueCount: 0,
          }),
        }),
      );
    });
  }); //END_Test_delete

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

    it('should default DisplayColour when absent', async () => {
      //Arrange
      jest
        .spyOn(mockUniversityService, 'getById')
        .mockResolvedValueOnce(undefined as any);
      mockDbResult(mockDb.select, []);
      const sparse = {
        BuildingName: 'IT Building',
        UniversityID: uniId,
        icon: 'test',
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

    it('should return the building when found', async () => {
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
      expect(result).toEqual(building);
    });
  }); //END_Test_uniqueBuildingNamePerUniversity

  describe('Test_validateUpdateBuildingInput', () => {
    it('should delegate to all sub-helpers and return the input', async () => {
      //Arrange
      const oldBuilding = createBuildingDto();
      const input = createUpdateBuildingInput();

      const nameSpy = jest
        .spyOn(service as any, 'validateBuildingNameUpdate')
        .mockResolvedValue(undefined);
      const locationSpy = jest
        .spyOn(service as any, 'validateLocationUpdate')
        .mockReturnValue(undefined);
      const footprintSpy = jest
        .spyOn(service as any, 'validateFootprintUpdate')
        .mockReturnValue(undefined);
      const iconSpy = jest
        .spyOn(service as any, 'validateIconUpdate')
        .mockReturnValue(undefined);
      const colourSpy = jest
        .spyOn(service as any, 'validateDisplayColourUpdate')
        .mockReturnValue(undefined);

      //Act
      const result = await (service as any).validateUpdateBuildingInput(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect(result).toBe(input);
      expect(nameSpy).toHaveBeenCalledWith(oldBuilding, input, mockDb);
      expect(locationSpy).toHaveBeenCalledWith(oldBuilding, input);
      expect(footprintSpy).toHaveBeenCalledWith(oldBuilding, input);
      expect(iconSpy).toHaveBeenCalledWith(oldBuilding, input);
      expect(colourSpy).toHaveBeenCalledWith(oldBuilding, input);
    });
  }); //END_Test_validateUpdateBuildingInput

  describe('Test_validateBuildingNameUpdate', () => {
    const oldBuilding = createBuildingDto({
      BuildingID: 'building-1',
      BuildingName: 'IT Building',
      UniversityID: uniId,
    });

    it('should delete BuildingName when undefined or unchanged', async () => {
      //Arrange
      const a = createUpdateBuildingInput();
      const b = createUpdateBuildingInput({
        BuildingName: oldBuilding.BuildingName,
      });

      //Act
      await (service as any).validateBuildingNameUpdate(oldBuilding, a, mockDb);
      await (service as any).validateBuildingNameUpdate(oldBuilding, b, mockDb);

      //Assert
      expect('BuildingName' in a).toBe(false);
      expect('BuildingName' in b).toBe(false);
    });

    it('should throw ConflictException when duplicate has a different ID', async () => {
      //Arrange
      const input = createUpdateBuildingInput({
        BuildingName: 'Other Building',
      });
      mockDbResult(mockDb.select, [
        { BuildingID: 'building-2', BuildingName: 'Other Building' },
      ]);

      //Act + Assert
      await expect(
        (service as any).validateBuildingNameUpdate(oldBuilding, input, mockDb),
      ).rejects.toThrow(ConflictException);
    });

    it('should keep BuildingName when changed and unique', async () => {
      //Arrange
      const input = createUpdateBuildingInput({ BuildingName: 'New Name' });
      mockDbResult(mockDb.select, []);

      //Act
      await (service as any).validateBuildingNameUpdate(
        oldBuilding,
        input,
        mockDb,
      );

      //Assert
      expect(input.BuildingName).toBe('New Name');
    });
  }); //END_Test_validateBuildingNameUpdate

  describe('Test_validateLocationUpdate', () => {
    const oldBuilding = createBuildingDto({
      location: { lat: -25.7545, lng: 28.2314 },
    });

    it('should delete location when undefined or null-with-old-null', () => {
      //Arrange
      const a = createUpdateBuildingInput();
      const b = createUpdateBuildingInput({ location: null });
      const oldNull = { ...oldBuilding, location: null };

      //Act
      (service as any).validateLocationUpdate(oldBuilding, a);
      (service as any).validateLocationUpdate(oldNull, b);

      //Assert
      expect('location' in a).toBe(false);
      expect('location' in b).toBe(false);
    });

    it('should delete location when same as old', () => {
      //Arrange
      const input = createUpdateBuildingInput({
        location: oldBuilding.location,
      });

      //Act
      (service as any).validateLocationUpdate(oldBuilding, input);

      //Assert
      expect('location' in input).toBe(false);
    });

    it('should keep location null when unpinning', () => {
      //Arrange
      const input = createUpdateBuildingInput({ location: null });

      //Act
      (service as any).validateLocationUpdate(oldBuilding, input);

      //Assert
      expect(input.location).toBeNull();
    });
  }); //END_Test_validateLocationUpdate

  describe('Test_validateFootprintUpdate', () => {
    const footprint = createFootprint();
    const oldBuilding = createBuildingDto({ footprint });

    it('should delete footprint when undefined or null-with-old-null', () => {
      //Arrange
      const a = createUpdateBuildingInput();
      const b = createUpdateBuildingInput({ footprint: null });
      const oldNull = { ...oldBuilding, footprint: null };

      //Act
      (service as any).validateFootprintUpdate(oldBuilding, a);
      (service as any).validateFootprintUpdate(oldNull, b);

      //Assert
      expect('footprint' in a).toBe(false);
      expect('footprint' in b).toBe(false);
    });

    it('should delete footprint when same as old', () => {
      //Arrange
      const input = createUpdateBuildingInput({ footprint });

      //Act
      (service as any).validateFootprintUpdate(oldBuilding, input);

      //Assert
      expect('footprint' in input).toBe(false);
    });

    it('should keep footprint null when clearing', () => {
      //Arrange
      const input = createUpdateBuildingInput({ footprint: null });

      //Act
      (service as any).validateFootprintUpdate(oldBuilding, input);

      //Assert
      expect(input.footprint).toBeNull();
    });
  }); //END_Test_validateFootprintUpdate

  describe('Test_validateIconUpdate', () => {
    const oldBuilding = createBuildingDto({ icon: 'school' });

    it('should delete icon when undefined or null-with-old-null', () => {
      //Arrange
      const a = createUpdateBuildingInput();
      const b = createUpdateBuildingInput({ icon: null });
      const oldNull = { ...oldBuilding, icon: null };

      //Act
      (service as any).validateIconUpdate(oldBuilding, a);
      (service as any).validateIconUpdate(oldNull, b);

      //Assert
      expect('icon' in a).toBe(false);
      expect('icon' in b).toBe(false);
    });

    it('should delete icon when empty or same after trim', () => {
      //Arrange
      const a = createUpdateBuildingInput({ icon: '   ' });
      const b = createUpdateBuildingInput({ icon: '  school  ' });

      //Act
      (service as any).validateIconUpdate(oldBuilding, a);
      (service as any).validateIconUpdate(oldBuilding, b);

      //Assert
      expect('icon' in a).toBe(false);
      expect('icon' in b).toBe(false);
    });

    it('should keep icon null when clearing an existing icon', () => {
      //Arrange
      const input = createUpdateBuildingInput({ icon: null });

      //Act
      (service as any).validateIconUpdate(oldBuilding, input);

      //Assert
      expect(input.icon).toBeNull();
    });

    it('should trim and keep icon when changed', () => {
      //Arrange
      const input = createUpdateBuildingInput({ icon: '  library  ' });

      //Act
      (service as any).validateIconUpdate(oldBuilding, input);

      //Assert
      expect(input.icon).toBe('library');
    });
  }); //END_Test_validateIconUpdate

  describe('Test_validateDisplayColourUpdate', () => {
    const oldBuilding = createBuildingDto({ displayColour: '#4A5548' });

    it('should delete DisplayColour when undefined or same as old', () => {
      //Arrange
      const a = createUpdateBuildingInput();
      const b = createUpdateBuildingInput({
        displayColour: oldBuilding.displayColour,
      });

      //Act
      (service as any).validateDisplayColourUpdate(oldBuilding, a);
      (service as any).validateDisplayColourUpdate(oldBuilding, b);

      //Assert
      expect('displayColour' in a).toBe(false);
      expect('displayColour' in b).toBe(false);
    });
  }); //END_Test_validateDisplayColourUpdate
});
