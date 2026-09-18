import { randomUUID } from 'crypto';
import { Route } from 'src/entities';
import { EventSource } from 'src/Events/dto/event.types';
import {
  RouteHeatmapDto,
  RouteHeatmapTransitionDto,
  RoutingHeatmapQueryDto,
  RoutingHeatmapView,
} from 'src/Route/dto/route.heatmap.dto';
import {
  Demand,
  EventAttendingRow,
  EventTransition,
  RouteRow,
} from 'src/Route/route.heatmap.service';

type RouteEntity = typeof Route.$inferSelect;

export function createRoute(overrides: Partial<RouteEntity> = {}): RouteEntity {
  return {
    RouteID: randomUUID(),
    UniversityID: randomUUID(),
    OriginBuildingID: randomUUID(),
    DestinationBuildingID: randomUUID(),
    RouteIndex: 0,
    PathCoordinates: [
      //IT building
      { lat: -25.756111, lng: 28.233417 },
      //Thuto
      { lat: -25.755833, lng: 28.230833 },
    ],
    DistanceMetres: 67,
    DisplayColour: '#0000FF',
    CreatedAt: new Date(),
    UpdatedAt: new Date(),
    ...overrides,
  };
}

// ROuteRow
export function createRouteRow(overrides: Partial<RouteRow> = {}): RouteRow {
  return {
    routeId: 'route-1',
    routeIndex: 0,
    originBuildingId: 'building-1',
    originBuildingName: 'Origin Building',
    destinationBuildingId: 'building-2',
    destinationBuildingName: 'Destination Building',
    pathCoordinates: [
      { lat: -25.7545, lng: 28.2314 },
      { lat: -25.755, lng: 28.232 },
    ],
    distanceMetres: 120,
    displayColour: '#808080',
    ...overrides,
  };
}

//EventAttendingRow
export function createEventAttendingRow(
  overrides: Partial<EventAttendingRow> = {},
): EventAttendingRow {
  return {
    userId: 'user-1',
    eventId: 'event-1',
    eventName: 'Test Event',
    eventCriteria: {
      eventSource: EventSource.UNIVERSITY,
      date: '2026-01-02',
      startTime: '08:00',
      endTime: '09:00',
      moduleId: 'module-1',
    },
    isRecurring: false,
    buildingId: 'building-1',
    moduleId: 'module-1',
    ...overrides,
  };
}

// src/Testing/Factories/route.factory.ts
export function createEventTransition(
  overrides: Partial<EventTransition> = {},
): EventTransition {
  return {
    userIds: new Set(['user-1']),
    originEventId: 'event-1',
    destinationEventId: 'event-2',
    originEventName: 'Origin Lecture',
    destinationEventName: 'Destination Lecture',
    originBuildingId: 'building-1',
    destinationBuildingId: 'building-2',
    originEndTime: '09:00',
    destinationStartTime: '10:00',
    originModuleId: 'module-1',
    destinationModuleId: 'module-2',
    ...overrides,
  };
}

//RoutingHeatmapQueryDto
export function createRoutingHeatmapQueryDto(
  overrides: Partial<RoutingHeatmapQueryDto> = {},
): RoutingHeatmapQueryDto {
  return {
    date: '2026-01-02',
    view: RoutingHeatmapView.ALL,
    ...overrides,
  };
}

//RouteHeatmapDto
export function createRouteHeatmapDto(
  overrides: Partial<RouteHeatmapDto> = {},
): RouteHeatmapDto {
  return {
    routeId: 'route-1',
    routeIndex: 0,
    origin: { buildingId: 'building-1', buildingName: 'Origin' },
    destination: { buildingId: 'building-2', buildingName: 'Destination' },
    distanceMetres: 120,
    pathCoordinates: [{ lat: -25.7545, lng: 28.2314 }],
    displayColour: '#808080',
    projected: 0,
    worstCase: 0,
    actual: null,
    hourly: [],
    transitions: [],
    ...overrides,
  };
}

//RouteHeatmapTransition Dto
export function createRouteHeatmapTransitionDto(
  overrides: Partial<RouteHeatmapTransitionDto> = {},
): RouteHeatmapTransitionDto {
  return {
    originEventId: randomUUID(),
    destinationEventId: randomUUID(),
    originEventName: 'Origin Lecture',
    destinationEventName: 'Destination Lecture',
    originEndTime: '10:20',
    destinationStartTime: '11:00',
    projected: 20,
    worstCase: 35,
    ...overrides,
  };
} //END_createRouteHeatmapTransitionDto

// Demand
export function createDemand(overrides: Partial<Demand> = {}): Demand {
  return {
    projected: 0,
    worstCase: 0,
    transition: createRouteHeatmapTransitionDto(),
    hours: [],
    ...overrides,
  };
} //END_Demand
