import { Test } from '@nestjs/testing';

//Actual Services
import { Demand, RouteHeatmapService } from './route.heatmap.service';
import { DatabaseService } from 'src/db/database.service';
import { RecurringEventService } from 'src/Events/recurring-event.service';

//Mock Services
import { createMockDatabase, mockDbResult } from 'src/Testing/Mocks';
import { createMockRecurringEventService } from 'src/Testing/Mocks/services';
import { uniId } from 'src/Testing/constants';
import {
  createDemand,
  createEventAttendingRow,
  createEventTransition,
  createRouteRow,
  createRoutingHeatmapQueryDto,
} from 'src/Testing/Factories';
import { EventSource } from 'src/Events/dto/event.types';
import { RoutingHeatmapView } from './dto/route.heatmap.dto';

describe('RouteHeatmapService', () => {
  let service: RouteHeatmapService;

  const { mockDb, reset: resetDatabase } = createMockDatabase();
  const { mockRecurringEventService, reset: resetRecurringEvent } =
    createMockRecurringEventService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RouteHeatmapService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: RecurringEventService, useValue: mockRecurringEventService },
      ],
    }).compile();

    service = module.get(RouteHeatmapService);
  });

  afterEach(() => {
    resetDatabase();
    resetRecurringEvent();
    jest.clearAllMocks();
  });

  describe('Test_getRoutingHeatmap', () => {
    const query = createRoutingHeatmapQueryDto();

    it('should return empty routes when university has none', async () => {
      //Arrange
      jest.spyOn(service as any, 'getUniversityRoutes').mockResolvedValue([]);

      //Act
      const result = await service.getRoutingHeatmap(uniId, query, mockDb);

      //Assert
      expect(result).toEqual({
        universityId: uniId,
        date: query.date,
        view: query.view,
        routes: [],
      });
    });

    it('should build a heatmap for each route', async () => {
      //Arrange
      const routeA = createRouteRow({ routeId: 'route-1' });
      const routeB = createRouteRow({ routeId: 'route-2' });
      const events = [createEventAttendingRow()];
      const transitions = [createEventTransition()];
      const demands = new Map<string, Demand[]>([
        ['building-1:building-2', []],
      ]);

      jest
        .spyOn(service as any, 'getUniversityRoutes')
        .mockResolvedValue([routeA, routeB]);
      const eventsSpy = jest
        .spyOn(service as any, 'getProjectedAttendedEventsForDate')
        .mockResolvedValue(events);
      const transitionsSpy = jest
        .spyOn(service as any, 'buildTransitions')
        .mockReturnValue(transitions);
      const demandSpy = jest
        .spyOn(service as any, 'transitionDemand')
        .mockResolvedValue(demands);

      //Act
      const result = await service.getRoutingHeatmap(uniId, query, mockDb);

      //Assert
      expect(result.universityId).toBe(uniId);
      expect(result.date).toBe(query.date);
      expect(result.view).toBe(query.view);
      expect(result.routes).toHaveLength(2);
      expect(result.routes[0].routeId).toBe('route-1');
      expect(result.routes[1].routeId).toBe('route-2');

      expect(eventsSpy).toHaveBeenCalledWith(uniId, query.date, mockDb);
      expect(transitionsSpy).toHaveBeenCalledWith(events);
      expect(demandSpy).toHaveBeenCalledWith(transitions, query.view, mockDb);
    });
  }); //END_Test_getRoutingHeatmap

  //Helpers
  describe('Test_getUniversityRoutes', () => {
    it('should return the route rows from the database', async () => {
      //Arrange
      const rows = [
        createRouteRow({ routeId: 'route-1' }),
        createRouteRow({ routeId: 'route-2' }),
      ];
      mockDbResult(mockDb.select, rows);

      //Act
      const result = await (service as any).getUniversityRoutes(uniId, mockDb);

      //Assert
      expect(result).toEqual(rows);
    });
  }); //END_Test_getUniversityRoutes

  describe('Test_getProjectedAttendedEventsForDate', () => {
    it('should return empty array when no rows or rows without a building', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);
      mockDbResult(mockDb.select, [
        createEventAttendingRow({ buildingId: undefined }),
      ]);

      //Act
      const noRows = await (service as any).getProjectedAttendedEventsForDate(
        uniId,
        '2026-01-02',
        mockDb,
      );
      const noBuilding = await (
        service as any
      ).getProjectedAttendedEventsForDate(uniId, '2026-01-02', mockDb);

      //Assert
      expect(noRows).toEqual([]);
      expect(noBuilding).toEqual([]);
      expect(mockRecurringEventService.occursOnDate).not.toHaveBeenCalled();
    });

    it('should filter out events that do not occur on the date', async () => {
      //Arrange
      mockDbResult(mockDb.select, [createEventAttendingRow()]);
      jest
        .spyOn(mockRecurringEventService, 'occursOnDate')
        .mockReturnValue(false);

      //Act
      const result = await (service as any).getProjectedAttendedEventsForDate(
        uniId,
        '2026-01-02',
        mockDb,
      );

      //Assert
      expect(result).toEqual([]);
    });

    it('should return rows that have a building and occur on the date', async () => {
      //Arrange
      const row = createEventAttendingRow({ buildingId: 'building-1' });
      mockDbResult(mockDb.select, [row]);
      jest
        .spyOn(mockRecurringEventService, 'occursOnDate')
        .mockReturnValue(true);

      //Act
      const result = await (service as any).getProjectedAttendedEventsForDate(
        uniId,
        '2026-01-02',
        mockDb,
      );

      //Assert
      expect(result).toEqual([row]);
    });
  }); //END_Test_getProjectedAttendedEventsForDate

  describe('Test_buildTransitions', () => {
    it('should return empty array when no rows provided', () => {
      //Act
      const result = (service as any).buildTransitions([]);

      //Assert
      expect(result).toEqual([]);
    });

    it('should build a transition between consecutive events in different buildings', () => {
      //Arrange
      const first = createEventAttendingRow({
        userId: 'user-1',
        eventId: 'event-1',
        eventName: 'First Lecture',
        buildingId: 'building-1',
        eventCriteria: {
          eventSource: EventSource.UNIVERSITY,
          startTime: '08:00',
          endTime: '09:00',
          moduleId: 'module-1',
        },
        moduleId: 'module-1',
      });
      const second = createEventAttendingRow({
        userId: 'user-1',
        eventId: 'event-2',
        eventName: 'Second Lecture',
        buildingId: 'building-2',
        eventCriteria: {
          eventSource: EventSource.UNIVERSITY,
          startTime: '10:00',
          endTime: '11:00',
          moduleId: 'module-2',
        },
        moduleId: 'module-2',
      });

      //Act
      const result = (service as any).buildTransitions([first, second]);

      //Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        originEventId: 'event-1',
        destinationEventId: 'event-2',
        originBuildingId: 'building-1',
        destinationBuildingId: 'building-2',
        originEndTime: '09:00',
        destinationStartTime: '10:00',
        originModuleId: 'module-1',
        destinationModuleId: 'module-2',
      });
      expect(result[0].userIds).toEqual(new Set(['user-1']));
    });

    it('should skip duplicate events and sort by start time then eventId', () => {
      //Arrange
      const later = createEventAttendingRow({
        userId: 'user-1',
        eventId: 'event-2',
        buildingId: 'building-2',
        eventCriteria: {
          eventSource: EventSource.UNIVERSITY,
          startTime: '10:00',
          endTime: '11:00',
          moduleId: 'm',
        },
      });
      const earlierDuplicate = createEventAttendingRow({
        userId: 'user-1',
        eventId: 'event-1',
        buildingId: 'building-1',
        eventCriteria: {
          eventSource: EventSource.UNIVERSITY,
          startTime: '08:00',
          endTime: '09:00',
          moduleId: 'm',
        },
      });
      const earlierSameId = createEventAttendingRow({
        userId: 'user-1',
        eventId: 'event-1',
        buildingId: 'building-99',
        eventCriteria: {
          eventSource: EventSource.UNIVERSITY,
          startTime: '08:00',
          endTime: '09:00',
          moduleId: 'm',
        },
      });
      const sameStartDifferentId = createEventAttendingRow({
        userId: 'user-1',
        eventId: 'event-3',
        buildingId: 'building-3',
        eventCriteria: {
          eventSource: EventSource.UNIVERSITY,
          startTime: '10:00',
          endTime: '11:00',
          moduleId: 'm',
        },
      });

      //Act
      const result = (service as any).buildTransitions([
        later,
        earlierDuplicate,
        earlierSameId,
        sameStartDifferentId,
      ]);

      //Assert
      expect(result.length).toBeGreaterThan(0);
    });

    it('should skip pairs in the same building or with overlapping times', () => {
      //Arrange
      const sameBuilding = [
        createEventAttendingRow({
          userId: 'user-1',
          eventId: 'event-1',
          buildingId: 'building-1',
          eventCriteria: {
            eventSource: EventSource.UNIVERSITY,
            startTime: '08:00',
            endTime: '09:00',
            moduleId: 'm',
          },
        }),
        createEventAttendingRow({
          userId: 'user-1',
          eventId: 'event-2',
          buildingId: 'building-1',
          eventCriteria: {
            eventSource: EventSource.UNIVERSITY,
            startTime: '10:00',
            endTime: '11:00',
            moduleId: 'm',
          },
        }),
      ];
      const overlapping = [
        createEventAttendingRow({
          userId: 'user-1',
          eventId: 'event-1',
          buildingId: 'building-1',
          eventCriteria: {
            eventSource: EventSource.UNIVERSITY,
            startTime: '08:00',
            endTime: '10:00',
            moduleId: 'm',
          },
        }),
        createEventAttendingRow({
          userId: 'user-1',
          eventId: 'event-2',
          buildingId: 'building-2',
          eventCriteria: {
            eventSource: EventSource.UNIVERSITY,
            startTime: '09:30',
            endTime: '11:00',
            moduleId: 'm',
          },
        }),
      ];

      //Act + Assert
      expect((service as any).buildTransitions(sameBuilding)).toEqual([]);
      expect((service as any).buildTransitions(overlapping)).toEqual([]);
    });

    it('should merge users into an existing transition for the same pair', () => {
      //Arrange
      const rows = [
        createEventAttendingRow({
          userId: 'user-1',
          eventId: 'event-1',
          buildingId: 'building-1',
          eventCriteria: {
            eventSource: EventSource.UNIVERSITY,
            startTime: '08:00',
            endTime: '09:00',
            moduleId: 'm',
          },
        }),
        createEventAttendingRow({
          userId: 'user-1',
          eventId: 'event-2',
          buildingId: 'building-2',
          eventCriteria: {
            eventSource: EventSource.UNIVERSITY,
            startTime: '10:00',
            endTime: '11:00',
            moduleId: 'm',
          },
        }),
        createEventAttendingRow({
          userId: 'user-2',
          eventId: 'event-1',
          buildingId: 'building-1',
          eventCriteria: {
            eventSource: EventSource.UNIVERSITY,
            startTime: '08:00',
            endTime: '09:00',
            moduleId: 'm',
          },
        }),
        createEventAttendingRow({
          userId: 'user-2',
          eventId: 'event-2',
          buildingId: 'building-2',
          eventCriteria: {
            eventSource: EventSource.UNIVERSITY,
            startTime: '10:00',
            endTime: '11:00',
            moduleId: 'm',
          },
        }),
      ];

      //Act
      const result = (service as any).buildTransitions(rows);

      //Assert
      expect(result).toHaveLength(1);
      expect(result[0].userIds).toEqual(new Set(['user-1', 'user-2']));
    });
  }); //END_Test_buildTransitions

  describe('Test_getWorstCaseCount', () => {
    it('should return 0 when either module ID is missing', async () => {
      //Arrange
      const transition = createEventTransition({
        originModuleId: null,
        destinationModuleId: 'module-2',
      });

      //Act
      const result = await (service as any).getWorstCaseCount(
        transition,
        mockDb,
      );

      //Assert
      expect(result).toBe(0);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('should count students enrolled in both modules', async () => {
      //Arrange
      const transition = createEventTransition({
        originModuleId: 'module-1',
        destinationModuleId: 'module-2',
      });
      mockDbResult(mockDb.select, [
        { moduleId: 'module-1', userId: 'user-1' },
        { moduleId: 'module-1', userId: 'user-2' },
        { moduleId: 'module-1', userId: 'user-3' },
        { moduleId: 'module-2', userId: 'user-1' },
        { moduleId: 'module-2', userId: 'user-3' },
        { moduleId: 'module-2', userId: 'user-4' },
      ]);

      //Act
      const result = await (service as any).getWorstCaseCount(
        transition,
        mockDb,
      );

      //Assert
      expect(result).toBe(2);
    });

    it('should return 0 when no students are enrolled in the origin module', async () => {
      //Arrange
      const transition = createEventTransition({
        originModuleId: 'module-1',
        destinationModuleId: 'module-2',
      });
      mockDbResult(mockDb.select, [{ moduleId: 'module-2', userId: 'user-1' }]);

      //Act
      const result = await (service as any).getWorstCaseCount(
        transition,
        mockDb,
      );

      //Assert
      expect(result).toBe(0);
    });
  }); //END_Test_getWorstCaseCount

  describe('Test_getTransitionHours', () => {
    it('should return the origin hour when destination is not after origin', () => {
      //Act
      const result = (service as any).getTransitionHours('09:00', '09:00');

      //Assert
      expect(result).toEqual([9]);
    });

    it('should return every hour between origin and destination', () => {
      //Act
      const result = (service as any).getTransitionHours('09:30', '11:30');

      //Assert
      expect(result).toEqual([9, 10, 11]);
    });
  }); //END_Test_getTransitionHours

  describe('Test_transitionDemand', () => {
    it('should return empty map when no transitions provided', async () => {
      //Act
      const result = await (service as any).transitionDemand(
        [],
        RoutingHeatmapView.ALL,
        mockDb,
      );

      //Assert
      expect(result.size).toBe(0);
    });

    it('should compute worstCase for WORST_CASE and ALL views', async () => {
      //Arrange
      const transition = createEventTransition({
        originBuildingId: 'building-1',
        destinationBuildingId: 'building-2',
        userIds: new Set(['user-1', 'user-2']),
      });
      jest.spyOn(service as any, 'getWorstCaseCount').mockResolvedValue(5);

      //Act
      const worst = await (service as any).transitionDemand(
        [transition],
        RoutingHeatmapView.WORST_CASE,
        mockDb,
      );
      const all = await (service as any).transitionDemand(
        [transition],
        RoutingHeatmapView.ALL,
        mockDb,
      );

      //Assert
      const worstDemand = worst.get('building-1:building-2')![0];
      expect(worstDemand.projected).toBe(0);
      expect(worstDemand.worstCase).toBe(5);

      const allDemand = all.get('building-1:building-2')![0];
      expect(allDemand.projected).toBe(2);
      expect(allDemand.worstCase).toBe(5);
    });

    it('should set worstCase to 0 when view is PROJECTED', async () => {
      //Arrange
      const transition = createEventTransition({
        originBuildingId: 'building-1',
        destinationBuildingId: 'building-2',
        userIds: new Set(['user-1', 'user-2', 'user-3']),
      });
      const spy = jest.spyOn(service as any, 'getWorstCaseCount');

      //Act
      const result = await (service as any).transitionDemand(
        [transition],
        RoutingHeatmapView.PROJECTED,
        mockDb,
      );

      //Assert
      const demands = result.get('building-1:building-2');
      expect(demands![0].projected).toBe(3);
      expect(demands![0].worstCase).toBe(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should skip transitions with zero projected and worstCase', async () => {
      //Arrange
      const transition = createEventTransition({
        originBuildingId: 'building-1',
        destinationBuildingId: 'building-2',
        userIds: new Set(),
      });

      //Act
      const result = await (service as any).transitionDemand(
        [transition],
        RoutingHeatmapView.PROJECTED,
        mockDb,
      );

      //Assert
      expect(result.size).toBe(0);
    });

    it('should append multiple demands to the same building pair', async () => {
      //Arrange
      const a = createEventTransition({
        originBuildingId: 'building-1',
        destinationBuildingId: 'building-2',
        userIds: new Set(['user-1']),
      });
      const b = createEventTransition({
        originBuildingId: 'building-1',
        destinationBuildingId: 'building-2',
        userIds: new Set(['user-2', 'user-3']),
      });

      //Act
      const result = await (service as any).transitionDemand(
        [a, b],
        RoutingHeatmapView.PROJECTED,
        mockDb,
      );

      //Assert
      const demands = result.get('building-1:building-2');
      expect(demands).toHaveLength(2);
      expect(demands![0].projected).toBe(1);
      expect(demands![1].projected).toBe(2);
    });
  }); //END_Test_transitionDemand

  describe('Test_buildRouteHeatmap', () => {
    const route = createRouteRow({ routeId: 'route-1' });

    it('should return zeroed metrics when no demand matches the pair', () => {
      //Arrange
      const demandByPair = new Map<string, Demand[]>();

      //Act
      const result = (service as any).buildRouteHeatmap(route, demandByPair);

      //Assert
      expect(result.routeId).toBe('route-1');
      expect(result.projected).toBe(0);
      expect(result.worstCase).toBe(0);
      expect(result.actual).toBeNull();
      expect(result.hourly).toHaveLength(24);
      expect(result.hourly.every((h: any) => h.projected === 0)).toBe(true);
      expect(result.transitions).toEqual([]);
    });

    it('should sum demand and distribute into hourly buckets', () => {
      //Arrange
      const demandA = createDemand({
        projected: 5,
        worstCase: 10,
        hours: [8, 9],
      });
      const demandB = createDemand({
        projected: 3,
        worstCase: 7,
        hours: [9],
      });
      const demandByPair = new Map<string, Demand[]>([
        ['building-1:building-2', [demandA, demandB]],
      ]);

      //Act
      const result = (service as any).buildRouteHeatmap(route, demandByPair);

      //Assert
      expect(result.projected).toBe(8);
      expect(result.worstCase).toBe(17);
      expect(result.hourly[8].projected).toBe(5);
      expect(result.hourly[8].worstCase).toBe(10);
      expect(result.hourly[9].projected).toBe(8);
      expect(result.hourly[9].worstCase).toBe(17);
      expect(result.hourly[10].projected).toBe(0);
      expect(result.transitions).toEqual([
        demandA.transition,
        demandB.transition,
      ]);
    });
  }); //END_Test_buildRouteHeatmap
}); //END_RouteHeatmapService
