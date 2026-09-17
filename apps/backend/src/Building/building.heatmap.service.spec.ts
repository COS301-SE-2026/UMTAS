import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  mockDbResult,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
import { BuildingService } from './building.service';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../db/database.service';

import {
  createMockBuildingService,
  createMockRecurringEventService,
  createMockVenueService,
} from 'src/Testing/Mocks/services';
import { VenueService } from 'src/Venue/venue.service';
import { uniId } from 'src/Testing/constants';
import {
  createBuildingDto,
  createBuildingHeatmapQueryDto,
  createBuildingHeatmapResponse,
  createBuildingHeatmapSummaryDto,
  createBuildingListResponse,
  createHourlyHeatmapBucketDto,
  createOccurringEventRow,
  createVenue,
  createVenueHeatmapDto,
} from 'src/Testing/Factories';
import { BuildingHeatmapView_ENUM } from './dto/heatmap.dto';
import { RecurringEventService } from 'src/Events/recurring-event.service';
import { EventSource } from 'src/Events/dto/event.types';
import {
  BuildingHeatmapService,
  NormalizedBuildingHeatmapQuery,
} from './building.heatmap.service';

export const DEFAULT_DISPLAY_COLOUR = '#808080';

describe('BuildingService', () => {
  let service: BuildingHeatmapService;

  const { mockDb, reset: resetDatabase } = createMockDatabase();
  const { mockBuildingService, reset: resetBuilding } =
    createMockBuildingService();
  const { mockVenueService, reset: resetVenue } = createMockVenueService();
  const { mockRecurringEventService, reset: resetRecEvent } =
    createMockRecurringEventService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BuildingHeatmapService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: BuildingService, useValue: mockBuildingService },
        { provide: VenueService, useValue: mockVenueService },
        { provide: RecurringEventService, useValue: mockRecurringEventService },
      ],
    }).compile();

    service = module.get(BuildingHeatmapService);
  });

  afterEach(() => {
    resetDatabase();
    resetBuilding();
    resetVenue();
    resetRecEvent();
    jest.clearAllMocks();
  });

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
      mockBuildingService.getById?.mockResolvedValue({ building, venues });
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
      mockBuildingService.getById?.mockResolvedValue({
        building,
        venues: undefined,
      });
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
      mockBuildingService.getAll?.mockResolvedValue(
        createBuildingListResponse({ buildings: [] }),
      );

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
      mockBuildingService.getAll?.mockResolvedValue(
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

    it('should preserve provided date and view', () => {
      //Act
      const result = (service as any).validateBuildingHeatmapQueryDto({
        date: '2026-03-01',
        view: BuildingHeatmapView_ENUM.PROJECTED,
      });

      //Assert
      expect(result).toEqual({
        date: '2026-03-01',
        view: BuildingHeatmapView_ENUM.PROJECTED,
      });
    });
  }); //END_Test_validateBuildingHeatmapQueryDto
});
