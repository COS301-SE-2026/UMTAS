import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  mockDbResult,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
import {
  BuildingService,
  NormalizedBuildingHeatmapQuery,
} from './building.service';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../db/database.service';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import {
  createMockRecurringEventService,
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
  createBuildingHeatmapQueryDto,
  createBuildingHeatmapResponse,
  createBuildingHeatmapSummaryDto,
  createBuildingListResponse,
  createBuildingQueryDto,
  createBuildingSingleResponse,
  createCreateBuildingInput,
  createFootprint,
  createHourlyHeatmapBucketDto,
  createOccurringEventRow,
  createUpdateBuildingInput,
  createVenue,
  createVenueHeatmapDto,
} from 'src/Testing/Factories';
import { BuildingHeatmapView_ENUM } from './dto/heatmap.dto';
import { RecurringEventService } from 'src/Events/recurring-event.service';
import { EventSource } from 'src/Events/dto/event.types';

export const DEFAULT_DISPLAY_COLOUR = '#808080';

describe('BuildingService', () => {
  let service: BuildingService;

  const { mockDb, reset: resetDatabase } = createMockDatabase();
  const { mockUniversityService, reset: resetUni } =
    createMockUniversityService();
  const { mockVenueService, reset: resetVenue } = createMockVenueService();
  const { mockRecurringEventService, reset: resetRecEvent } =
    createMockRecurringEventService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BuildingService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: UniversityService, useValue: mockUniversityService },
        { provide: VenueService, useValue: mockVenueService },
        { provide: RecurringEventService, useValue: mockRecurringEventService },
      ],
    }).compile();

    service = module.get(BuildingService);
  });

  afterEach(() => {
    resetDatabase();
    resetUni();
    resetVenue();
    resetRecEvent();
    jest.clearAllMocks();
  });

  //Create
  describe('Test_create', () => {
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

    it('should pass validated input to the insert', async () => {
      //Arrange
      const input = createCreateBuildingInput();
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
      const result = await service.getAll(uniId, createBuildingQueryDto());

      //Assert
      expect(result).toEqual({ buildings: [] });
    });

    it('should return buildings mapped with venue counts', async () => {
      //Arrange
      const building = createBuilding();
      mockDbResult(mockDb.select, [{ building, venueCount: 3 }]);

      //Act
      const result = await service.getAll(uniId, createBuildingQueryDto());

      //Assert
      expect(result).toEqual(
        createBuildingListResponse({
          buildings: [
            createBuildingDto({
              BuildingID: building.BuildingID,
              BuildingName: building.BuildingName,
              UniversityID: building.UniversityID,
              location: { lat: building.Latitude!, lng: building.Longitude! },
              venueCount: 3,
            }),
          ],
        }),
      );
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

    it('should map location from Latitude and Longitude columns', async () => {
      //Arrange
      const building = createBuilding({
        Latitude: -25.7545,
        Longitude: 28.2314,
      });
      mockDbResult(mockDb.select, [{ building, venueCount: 0 }]);

      //Act
      const result = await service.getAll(uniId, createBuildingQueryDto());

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
      const result = await service.getAll(uniId, createBuildingQueryDto());

      //Assert
      expect(result.buildings[0].location).toBeNull();
    });

    it('should map location to null when Longitude is null', async () => {
      //Arrange
      const building = createBuilding({ Latitude: -25.7545, Longitude: null });
      mockDbResult(mockDb.select, [{ building, venueCount: 0 }]);

      //Act
      const result = await service.getAll(uniId, createBuildingQueryDto());

      //Assert
      expect(result.buildings[0].location).toBeNull();
    });
  }); //END_Test_getAll

  //Update
  describe('Test_update', () => {
    it('should throw NotFoundException if building does not exist', async () => {
      //Arrange
      const input = createUpdateBuildingInput();
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

  //getHeatmap
  describe('Test_getHeatmap', () => {
    it('should return the assembled heatmap response', async () => {
      //Arrange
      const query = createBuildingHeatmapQueryDto();
      const validatedQuery = {
        date: '2026-01-02',
        view: query.view,
      };
      const building = createBuildingDto();
      const venues = [createVenue({ BuildingID: building.BuildingID })];
      const venuesHeatmap = [
        createVenueHeatmapDto({ VenueID: venues[0].VenueID }),
      ];
      const summary = createBuildingHeatmapSummaryDto({
        Capacity: 100,
        projected: 40,
        worstCase: 80,
        projectedUtilisation: 0.4,
        worstCaseUtilisation: 0.8,
      });
      const hourly = [createHourlyHeatmapBucketDto()];

      jest
        .spyOn(service as any, 'validateBuildingHeatmapQueryDto')
        .mockReturnValue(validatedQuery);
      jest.spyOn(service, 'getById').mockResolvedValue({ building, venues });
      jest
        .spyOn(service as any, 'getVenueHeatmapData')
        .mockResolvedValue(venuesHeatmap);
      jest
        .spyOn(service as any, 'buildHeatmapSummary')
        .mockReturnValue(summary);
      jest.spyOn(service as any, 'buildHourlySummary').mockReturnValue(hourly);

      mockTransaction(mockDb, {});

      //Act
      const result = await service.getHeatmap(
        uniId,
        building.BuildingID,
        query,
      );

      //Assert
      expect(result).toEqual(
        createBuildingHeatmapResponse({
          building,
          date: validatedQuery.date,
          summary,
          hourly,
          venues: venuesHeatmap,
        }),
      );
    });

    it('should default venues to empty array when getById returns none', async () => {
      //Arrange
      const query = createBuildingHeatmapQueryDto();
      const validatedQuery = {
        date: '2026-01-02',
        view: query.view,
      };
      const building = createBuildingDto();

      jest
        .spyOn(service as any, 'validateBuildingHeatmapQueryDto')
        .mockReturnValue(validatedQuery);
      jest
        .spyOn(service, 'getById')
        .mockResolvedValue({ building, venues: undefined });
      const heatmapSpy = jest
        .spyOn(service as any, 'getVenueHeatmapData')
        .mockResolvedValue([]);
      jest
        .spyOn(service as any, 'buildHeatmapSummary')
        .mockReturnValue(createBuildingHeatmapSummaryDto());
      jest.spyOn(service as any, 'buildHourlySummary').mockReturnValue([]);

      mockTransaction(mockDb, {});

      //Act
      await service.getHeatmap(uniId, building.BuildingID, query);

      //Assert
      expect(heatmapSpy).toHaveBeenCalledWith([], validatedQuery, mockDb);
    });
  }); //END_Test_getHeatmap

  //getALlBuildingsHeatmap
  describe('Test_getAllBuildingsHeatmap', () => {
    const validatedQuery = {
      date: '2026-01-02',
      view: BuildingHeatmapView_ENUM.ALL,
    };

    it('should return empty array when no buildings exist', async () => {
      //Arrange
      const query = createBuildingHeatmapQueryDto();
      jest
        .spyOn(service as any, 'validateBuildingHeatmapQueryDto')
        .mockReturnValue(validatedQuery);
      jest
        .spyOn(service, 'getAll')
        .mockResolvedValue(createBuildingListResponse({ buildings: [] }));

      mockTransaction(mockDb, {});

      //Act
      const result = await service.getAllBuildingsHeatmap(uniId, query);

      //Assert
      expect(result).toEqual({ buildings: [] });
    });

    it('should assemble a heatmap for each building', async () => {
      //Arrange
      const query = createBuildingHeatmapQueryDto();
      const buildingA = createBuildingDto({ BuildingID: 'building-1' });
      const buildingB = createBuildingDto({ BuildingID: 'building-2' });
      const venuesA = [
        createVenue({ VenueID: 'venue-1', BuildingID: 'building-1' }),
      ];
      const venuesB = [
        createVenue({ VenueID: 'venue-2', BuildingID: 'building-2' }),
      ];
      const heatmapA = [createVenueHeatmapDto({ VenueID: 'venue-1' })];
      const heatmapB = [createVenueHeatmapDto({ VenueID: 'venue-2' })];
      const hourly = [createHourlyHeatmapBucketDto()];
      const summary = createBuildingHeatmapSummaryDto();

      jest
        .spyOn(service as any, 'validateBuildingHeatmapQueryDto')
        .mockReturnValue(validatedQuery);
      jest
        .spyOn(service, 'getAll')
        .mockResolvedValue(
          createBuildingListResponse({ buildings: [buildingA, buildingB] }),
        );
      const venuesSpy = jest
        .spyOn(mockVenueService, 'getAllVenues')
        .mockResolvedValueOnce({ venues: venuesA })
        .mockResolvedValueOnce({ venues: venuesB });
      const heatmapSpy = jest
        .spyOn(service as any, 'getVenueHeatmapData')
        .mockResolvedValueOnce(heatmapA)
        .mockResolvedValueOnce(heatmapB);
      jest.spyOn(service as any, 'buildHourlySummary').mockReturnValue(hourly);
      jest
        .spyOn(service as any, 'buildHeatmapSummary')
        .mockReturnValue(summary);

      mockTransaction(mockDb, {});

      //Act
      const result = await service.getAllBuildingsHeatmap(uniId, query);

      //Assert
      expect(result.buildings).toEqual([
        createBuildingHeatmapResponse({
          building: buildingA,
          date: validatedQuery.date,
          hourly,
          summary,
          venues: heatmapA,
        }),
        createBuildingHeatmapResponse({
          building: buildingB,
          date: validatedQuery.date,
          hourly,
          summary,
          venues: heatmapB,
        }),
      ]);
      expect(venuesSpy).toHaveBeenCalledTimes(2);
      expect(heatmapSpy).toHaveBeenCalledTimes(2);
    });
  }); //END_Test_getAllBuildingsHeatmap

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

    it('should keep BuildingName when duplicate is self', async () => {
      //Arrange
      const input = createUpdateBuildingInput({ BuildingName: 'New Name' });
      mockDbResult(mockDb.select, [
        { BuildingID: oldBuilding.BuildingID, BuildingName: 'New Name' },
      ]);

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

    it('should keep location null when unpinning', () => {
      //Arrange
      const input = createUpdateBuildingInput({ location: null });

      //Act
      (service as any).validateLocationUpdate(oldBuilding, input);

      //Assert
      expect(input.location).toBeNull();
    });

    it('should keep location when old is null and new provided', () => {
      //Arrange
      const oldNull = { ...oldBuilding, location: null };
      const input = createUpdateBuildingInput({
        location: { lat: -26, lng: 29 },
      });

      //Act
      (service as any).validateLocationUpdate(oldNull, input);

      //Assert
      expect(input.location).toEqual({ lat: -26, lng: 29 });
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

    it('should keep location when changed', () => {
      //Arrange
      const input = createUpdateBuildingInput({
        location: { lat: -26, lng: 29 },
      });

      //Act
      (service as any).validateLocationUpdate(oldBuilding, input);

      //Assert
      expect(input.location).toEqual({ lat: -26, lng: 29 });
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

    it('should keep footprint null when clearing', () => {
      //Arrange
      const input = createUpdateBuildingInput({ footprint: null });

      //Act
      (service as any).validateFootprintUpdate(oldBuilding, input);

      //Assert
      expect(input.footprint).toBeNull();
    });

    it('should delete footprint when same as old', () => {
      //Arrange
      const input = createUpdateBuildingInput({ footprint });

      //Act
      (service as any).validateFootprintUpdate(oldBuilding, input);

      //Assert
      expect('footprint' in input).toBe(false);
    });

    it('should keep footprint when changed', () => {
      //Arrange
      const newFootprint = createFootprint({
        coordinates: [
          [
            [30, -26],
            [31, -26],
            [31, -27],
            [30, -26],
          ],
        ],
      });
      const input = createUpdateBuildingInput({ footprint: newFootprint });

      //Act
      (service as any).validateFootprintUpdate(oldBuilding, input);

      //Assert
      expect(input.footprint).toBe(newFootprint);
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

    it('should keep icon null when clearing an existing icon', () => {
      //Arrange
      const input = createUpdateBuildingInput({ icon: null });

      //Act
      (service as any).validateIconUpdate(oldBuilding, input);

      //Assert
      expect(input.icon).toBeNull();
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

    it('should keep DisplayColour when changed', () => {
      //Arrange
      const input = createUpdateBuildingInput({ displayColour: '#ABCDEF' });

      //Act
      (service as any).validateDisplayColourUpdate(oldBuilding, input);

      //Assert
      expect(input.displayColour).toBe('#ABCDEF');
    });
  }); //END_Test_validateDisplayColourUpdate

  describe('Test_validateBuildingHeatmapQueryDto', () => {
    it('should default date to today when absent', () => {
      //Arrange
      const today = new Date().toISOString().slice(0, 10);

      //Act
      const result = (service as any).validateBuildingHeatmapQueryDto({
        view: BuildingHeatmapView_ENUM.ALL,
      });

      //Assert
      expect(result).toEqual({
        date: today,
        view: BuildingHeatmapView_ENUM.ALL,
      });
    });

    it('should preserve provided date', () => {
      //Act
      const result = (service as any).validateBuildingHeatmapQueryDto({
        date: '2026-03-01',
        view: BuildingHeatmapView_ENUM.ALL,
      });

      //Assert
      expect(result.date).toBe('2026-03-01');
    });
  }); //END_Test_validateBuildingHeatmapQueryDto

  describe('Test_getVenueHeatmapData', () => {
    const query: NormalizedBuildingHeatmapQuery = {
      date: '2026-01-02',
      view: BuildingHeatmapView_ENUM.ALL,
    };

    it('should return empty array when no venues provided', async () => {
      //Act
      const result = await (service as any).getVenueHeatmapData(
        [],
        query,
        mockDb,
      );

      //Assert
      expect(result).toEqual([]);
    });

    it('should only load projected counts when view is PROJECTED', async () => {
      //Arrange
      const venue = createVenue({ VenueID: 'venue-1' });
      jest.spyOn(service as any, 'getOccuringEventRows').mockResolvedValue([]);
      const projectedSpy = jest
        .spyOn(service as any, 'getProjectedCountsByEvent')
        .mockResolvedValue(new Map());
      const worstCaseSpy = jest
        .spyOn(service as any, 'getWorstCaseCountsByEvent')
        .mockResolvedValue(new Map());
      jest
        .spyOn(service as any, 'buildVenueHeatmapFromEvents')
        .mockReturnValue(createVenueHeatmapDto());

      //Act
      await (service as any).getVenueHeatmapData(
        [venue],
        { ...query, view: BuildingHeatmapView_ENUM.PROJECTED },
        mockDb,
      );

      //Assert
      expect(projectedSpy).toHaveBeenCalled();
      expect(worstCaseSpy).not.toHaveBeenCalled();
    });

    it('should only load worstCase counts when view is WORST_CASE', async () => {
      //Arrange
      const venue = createVenue({ VenueID: 'venue-1' });
      jest.spyOn(service as any, 'getOccuringEventRows').mockResolvedValue([]);
      const projectedSpy = jest
        .spyOn(service as any, 'getProjectedCountsByEvent')
        .mockResolvedValue(new Map());
      const worstCaseSpy = jest
        .spyOn(service as any, 'getWorstCaseCountsByEvent')
        .mockResolvedValue(new Map());
      jest
        .spyOn(service as any, 'buildVenueHeatmapFromEvents')
        .mockReturnValue(createVenueHeatmapDto());

      //Act
      await (service as any).getVenueHeatmapData(
        [venue],
        { ...query, view: BuildingHeatmapView_ENUM.WORST_CASE },
        mockDb,
      );

      //Assert
      expect(projectedSpy).not.toHaveBeenCalled();
      expect(worstCaseSpy).toHaveBeenCalled();
    });

    it('should group event rows by venue and delegate to buildVenueHeatmapFromEvents', async () => {
      //Arrange
      const venueA = createVenue({ VenueID: 'venue-1' });
      const venueB = createVenue({ VenueID: 'venue-2' });

      const rowA1 = {
        venueId: 'venue-1',
        eventId: 'event-1',
        linkedHours: [8],
      };
      const rowA2 = {
        venueId: 'venue-1',
        eventId: 'event-2',
        linkedHours: [9],
      };
      const rowB1 = {
        venueId: 'venue-2',
        eventId: 'event-3',
        linkedHours: [10],
      };

      jest
        .spyOn(service as any, 'getOccuringEventRows')
        .mockResolvedValue([rowA1, rowA2, rowB1]);
      jest
        .spyOn(service as any, 'getProjectedCountsByEvent')
        .mockResolvedValue(new Map());
      jest
        .spyOn(service as any, 'getWorstCaseCountsByEvent')
        .mockResolvedValue(new Map());
      const buildSpy = jest
        .spyOn(service as any, 'buildVenueHeatmapFromEvents')
        .mockReturnValue(createVenueHeatmapDto());

      //Act
      const result = await (service as any).getVenueHeatmapData(
        [venueA, venueB],
        query,
        mockDb,
      );

      //Assert
      expect(result).toHaveLength(2);
      expect(buildSpy).toHaveBeenCalledWith(
        venueA,
        [rowA1, rowA2],
        expect.anything(),
        expect.anything(),
      );
      expect(buildSpy).toHaveBeenCalledWith(
        venueB,
        [rowB1],
        expect.anything(),
        expect.anything(),
      );
    });
  }); //END_Test_getVenueHeatmapData

  describe('Test_calculateUtilisation', () => {
    it('should return null when capacity is 0', () => {
      //Act
      const result = (service as any).calculateUtilisation(45, 0);

      //Assert
      expect(result).toBeNull();
    });

    it('should return attendance divided by capacity', () => {
      //Act
      const result = (service as any).calculateUtilisation(45, 120);

      //Assert
      expect(result).toBe(0.375);
    });
  }); //END_Test_calculateUtilisation

  describe('Test_buildHeatmapSummary', () => {
    it('should return zeros and nulls when venues is empty', () => {
      //Act
      const result = (service as any).buildHeatmapSummary([]);

      //Assert
      expect(result).toEqual(
        createBuildingHeatmapSummaryDto({
          Capacity: 0,
          projected: 0,
          worstCase: 0,
          actual: null,
          projectedUtilisation: null,
          worstCaseUtilisation: null,
        }),
      );
    });

    it('should return actual null when all venues have null actual', () => {
      //Arrange
      const venues = [
        createVenueHeatmapDto({ Capacity: 100, actual: null }),
        createVenueHeatmapDto({ Capacity: 50, actual: null }),
      ];

      //Act
      const result = (service as any).buildHeatmapSummary(venues);

      //Assert
      expect(result.actual).toBeNull();
    });

    it('should sum all metrics and compute utilisation when venues have values', () => {
      //Arrange
      const venues = [
        createVenueHeatmapDto({
          Capacity: 100,
          projected: 40,
          worstCase: 80,
          actual: 30,
        }),
        createVenueHeatmapDto({
          Capacity: 50,
          projected: 20,
          worstCase: 30,
          actual: 15,
        }),
      ];

      //Act
      const result = (service as any).buildHeatmapSummary(venues);

      //Assert
      expect(result).toEqual(
        createBuildingHeatmapSummaryDto({
          Capacity: 150,
          projected: 60,
          worstCase: 110,
          actual: 45,
          projectedUtilisation: 60 / 150,
          worstCaseUtilisation: 110 / 150,
        }),
      );
    });
  }); //END_Test_buildHeatmapSummary

  describe('Test_buildHourlySummary', () => {
    it('should return 24 zeroed buckets when venues is empty', () => {
      //Act
      const result = (service as any).buildHourlySummary([]);

      //Assert
      expect(result).toHaveLength(24);
      expect(result[0]).toEqual(
        createHourlyHeatmapBucketDto({
          hour: 0,
          Capacity: 0,
          projected: 0,
          worstCase: 0,
          actual: null,
          projectedUtilisation: null,
          worstCaseUtilisation: null,
        }),
      );
      expect(result[23].hour).toBe(23);
    });

    it('should sum per-venue hourly metrics across venues for each hour', () => {
      //Arrange
      const venueA = createVenueHeatmapDto({
        Capacity: 100,
        hourly: Array.from({ length: 24 }, (_, hour) =>
          createHourlyHeatmapBucketDto({ hour, projected: 10, worstCase: 20 }),
        ),
      });
      const venueB = createVenueHeatmapDto({
        Capacity: 50,
        hourly: Array.from({ length: 24 }, (_, hour) =>
          createHourlyHeatmapBucketDto({ hour, projected: 5, worstCase: 15 }),
        ),
      });

      //Act
      const result = (service as any).buildHourlySummary([venueA, venueB]);

      //Assert
      expect(result).toHaveLength(24);
      expect(result[0]).toEqual(
        createHourlyHeatmapBucketDto({
          hour: 0,
          Capacity: 150,
          projected: 15,
          worstCase: 35,
          actual: null,
          projectedUtilisation: 15 / 150,
          worstCaseUtilisation: 35 / 150,
        }),
      );
    });
  }); //END_Test_buildHourlySummary

  describe('Test_buildVenueHeatmapFromEvents', () => {
    const venue = createVenue();

    it('should return zeroed metrics when no events for the venue', () => {
      //Arrange
      const projectedByEvent = new Map<string, number>();
      const worstCaseByEvent = new Map<string, number>();

      //Act
      const result = (service as any).buildVenueHeatmapFromEvents(
        venue,
        [],
        projectedByEvent,
        worstCaseByEvent,
      );

      //Assert
      expect(result.projected).toBe(0);
      expect(result.worstCase).toBe(0);
      expect(result.hourly).toHaveLength(24);
      expect(result.hourly.every((h: any) => h.projected === 0)).toBe(true);
      expect(result.hourly.every((h: any) => h.worstCase === 0)).toBe(true);
    });

    it('should accumulate daily and hourly totals from event data', () => {
      //Arrange
      const eventsForVenue = [
        createOccurringEventRow({
          eventId: 'event-1',
          linkedHours: [8, 9],
        }),
        createOccurringEventRow({
          eventId: 'event-2',
          linkedHours: [8],
        }),
      ];
      const projectedByEvent = new Map([
        ['event-1', 30],
        ['event-2', 10],
      ]);
      const worstCaseByEvent = new Map([
        ['event-1', 40],
        ['event-2', 20],
      ]);

      //Act
      const result = (service as any).buildVenueHeatmapFromEvents(
        venue,
        eventsForVenue,
        projectedByEvent,
        worstCaseByEvent,
      );

      //Assert
      expect(result.projected).toBe(40);
      expect(result.worstCase).toBe(60);
      expect(result.hourly[8].projected).toBe(40);
      expect(result.hourly[8].worstCase).toBe(60);
      expect(result.hourly[9].projected).toBe(30);
      expect(result.hourly[9].worstCase).toBe(40);
      expect(result.hourly[10].projected).toBe(0);
    });

    it('should default missing event metrics to zero', () => {
      //Arrange
      const eventsForVenue = [
        createOccurringEventRow({
          eventId: 'event-1',
          linkedHours: [8],
        }),
      ];
      const projectedByEvent = new Map<string, number>(); // empty
      const worstCaseByEvent = new Map<string, number>(); // empty

      //Act
      const result = (service as any).buildVenueHeatmapFromEvents(
        venue,
        eventsForVenue,
        projectedByEvent,
        worstCaseByEvent,
      );

      //Assert
      expect(result.projected).toBe(0);
      expect(result.worstCase).toBe(0);
      expect(result.hourly[8].projected).toBe(0);
      expect(result.hourly[8].worstCase).toBe(0);
    });
  }); //END_Test_buildVenueHeatmapFromEvents

  describe('Test_getProjectedCountsByEvent', () => {
    it('should return empty map when no eventIds provided', async () => {
      //Act
      const result = await (service as any).getProjectedCountsByEvent(
        [],
        '2026-01-02',
        mockDb,
      );

      //Assert
      expect(result.size).toBe(0);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('should map event IDs to distinct attending counts', async () => {
      //Arrange
      mockDbResult(mockDb.select, [
        { eventId: 'event-1', count: '5' },
        { eventId: 'event-2', count: '3' },
      ]);

      //Act
      const result = await (service as any).getProjectedCountsByEvent(
        ['event-1', 'event-2'],
        '2026-01-02',
        mockDb,
      );

      //Assert
      expect(result.get('event-1')).toBe(5);
      expect(result.get('event-2')).toBe(3);
    });
  }); //END_Test_getProjectedCountsByEvent

  describe('Test_getWorstCaseCountsByEvent', () => {
    it('should return empty map when no eventIds provided', async () => {
      //Act
      const result = await (service as any).getWorstCaseCountsByEvent(
        [],
        mockDb,
      );

      //Assert
      expect(result.size).toBe(0);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('should map event IDs to enrolment counts and skip null event IDs', async () => {
      //Arrange
      mockDbResult(mockDb.select, [
        { eventId: 'event-1', count: '7' },
        { eventId: null, count: '2' },
        { eventId: 'event-2', count: '4' },
      ]);

      //Act
      const result = await (service as any).getWorstCaseCountsByEvent(
        ['event-1', 'event-2'],
        mockDb,
      );

      //Assert
      expect(result.size).toBe(2);
      expect(result.get('event-1')).toBe(7);
      expect(result.get('event-2')).toBe(4);
    });
  }); //END_Test_getWorstCaseCountsByEvent

  describe('Test_getOccuringEventRows', () => {
    it('should return empty array when no venueIds provided', async () => {
      //Act
      const result = await (service as any).getOccuringEventRows(
        [],
        '2026-01-02',
        mockDb,
      );

      //Assert
      expect(result).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('should skip events that do not occur on the date', async () => {
      //Arrange
      mockDbResult(mockDb.select, [
        {
          venueId: 'venue-1',
          eventId: 'event-1',
          eventCriteria: {
            eventSource: EventSource.UNIVERSITY,
            startTime: '08:00',
            endTime: '09:00',
            date: '2026-01-01',
          },
          isRecurring: false,
        },
      ]);
      jest
        .spyOn(mockRecurringEventService, 'occursOnDate')
        .mockReturnValue(false);

      //Act
      const result = await (service as any).getOccuringEventRows(
        ['venue-1'],
        '2026-01-02',
        mockDb,
      );

      //Assert
      expect(result).toEqual([]);
    });

    it('should return occurring events with their linked hours', async () => {
      //Arrange
      mockDbResult(mockDb.select, [
        {
          venueId: 'venue-1',
          eventId: 'event-1',
          eventCriteria: {
            eventSource: EventSource.UNIVERSITY,
            startTime: '08:00',
            endTime: '09:00',
            date: '2026-01-02',
          },
          isRecurring: false,
        },
      ]);
      jest
        .spyOn(mockRecurringEventService, 'occursOnDate')
        .mockReturnValue(true);

      //Act
      const result = await (service as any).getOccuringEventRows(
        ['venue-1'],
        '2026-01-02',
        mockDb,
      );

      //Assert
      expect(result).toEqual([
        {
          venueId: 'venue-1',
          eventId: 'event-1',
          linkedHours: [8],
        },
      ]);
    });
  }); //END_Test_getOccuringEventRows
});
