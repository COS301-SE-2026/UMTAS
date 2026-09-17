import { randomUUID } from 'node:crypto';
import type {
  BuildingSingleResponseDto,
  BuildingDto,
  CreateBuildingInput,
  UpdateBuildingInput,
  BuildingQueryDto,
  GeoJsonPolygon,
} from '../../Building/dto/building.dto';
import { Building } from '../../entities';
import { type DeepPartial, mergeDeep } from './factory.util';
import { buildingId, uniId } from '../constants';
import {
  BuildingHeatmapQueryDto,
  BuildingHeatmapResponseDto,
  BuildingHeatmapSummaryDto,
  BuildingHeatmapView_ENUM,
  HourlyHeatmapBucketDto,
  VenueHeatmapDto,
} from 'src/Building/dto/heatmap.dto';
import { OccurringEventRow } from 'src/Building/building.service';

const DEFAULT_BUILDING_ID = buildingId;
const DEFAULT_UNIVERSITY_ID = uniId;

//Building entity
type BuildingEntity = typeof Building.$inferSelect;

export function createBuilding(
  overrides: Partial<BuildingEntity> = {},
): BuildingEntity {
  return {
    BuildingID: randomUUID(),
    UniversityID: randomUUID(),
    BuildingName: 'Test building',
    Latitude: -25.756111,
    Longitude: 28.233417,
    Footprint: null,
    Icon: null,
    DisplayColour: null,
    CreatedAt: new Date(),
    CreatedBy: null,
    UpdateAt: new Date(),
    ...overrides,
  };
} //END_createBuilding

//BuildingDto
export function createBuildingDto(
  overrides: DeepPartial<BuildingDto> = {},
): BuildingDto {
  return mergeDeep(
    {
      BuildingID: DEFAULT_BUILDING_ID,
      BuildingName: 'Test building',
      UniversityID: DEFAULT_UNIVERSITY_ID,
      location: {
        lat: -25.756111,
        lng: 28.233417,
      },
      footprint: null,
      icon: null,
      displayColour: null,
      venueCount: 0,
    },
    overrides,
  );
} //END_createBuildingDto

//Single response
export function createBuildingSingleResponse(
  overrides: DeepPartial<BuildingSingleResponseDto> = {},
): BuildingSingleResponseDto {
  return mergeDeep(
    {
      building: createBuildingDto(),
    },
    overrides,
  );
} //END_createBuildingSingleResponse

//List item
export function createBuildingListItem(
  overrides: DeepPartial<BuildingDto> = {},
): BuildingDto {
  return mergeDeep(
    {
      ...createBuildingDto(),
    },
    overrides,
  );
} //END_createBuildingListItem

//List Response
export function createBuildingListResponse(
  overrides: {
    buildings?: DeepPartial<BuildingDto>[];
    message?: string;
  } = {},
): {
  buildings: BuildingDto[];
  message?: string;
} {
  return {
    buildings: (overrides.buildings ?? [createBuildingListItem()]).map(
      (building) => createBuildingListItem(building),
    ),
    ...(overrides.message === undefined ? {} : { message: overrides.message }),
  };
} //END_createBuildingListResponse

//Venue Heatmap
export function createVenueHeatmapDto(
  overrides: Partial<VenueHeatmapDto> = {},
): VenueHeatmapDto {
  return {
    VenueID: randomUUID(),
    VenueName: 'Test Venue Name',
    Capacity: 100,
    projected: 50,
    worstCase: 90,
    actual: 20,
    projectedUtilisation: 0.5,
    worstCaseUtilisation: 0.9,
    hourly: [],

    ...overrides,
  };
} //END_createVenueHeatmapDto

// CreateBuildingInput
export function createCreateBuildingInput(
  overrides: DeepPartial<CreateBuildingInput> = {},
): CreateBuildingInput {
  return mergeDeep(
    {
      BuildingName: 'Test Building',
      UniversityID: uniId,
      location: { lat: -25.756111, lng: 28.233417 },
      footprint: null,
      icon: null,
      displayColour: '#808080',
      CreatedBy: 'user-1',
    },
    overrides,
  );
}

// Update Building Input
export function createUpdateBuildingInput(
  overrides: DeepPartial<UpdateBuildingInput> = {},
): UpdateBuildingInput {
  return mergeDeep({}, overrides);
}

// BuildingQueryDto
export function createBuildingQueryDto(
  overrides: DeepPartial<BuildingQueryDto> = {},
): BuildingQueryDto {
  return mergeDeep({}, overrides);
}

// BuildingHeatmapQueryDto
export function createBuildingHeatmapQueryDto(
  overrides: DeepPartial<BuildingHeatmapQueryDto> = {},
): BuildingHeatmapQueryDto {
  return mergeDeep(
    {
      date: '2026-06-30',
      view: BuildingHeatmapView_ENUM.ALL,
    },
    overrides,
  );
}

// BuildingHeatmapSummaryDto
export function createBuildingHeatmapSummaryDto(
  overrides: Partial<BuildingHeatmapSummaryDto> = {},
): BuildingHeatmapSummaryDto {
  return {
    Capacity: 0,
    projected: 0,
    worstCase: 0,
    actual: null,
    projectedUtilisation: null,
    worstCaseUtilisation: null,
    ...overrides,
  };
}

// BuildingHeatmapResponseDto
export function createBuildingHeatmapResponse(
  overrides: DeepPartial<BuildingHeatmapResponseDto> = {},
): BuildingHeatmapResponseDto {
  return mergeDeep(
    {
      building: createBuildingDto(),
      date: '2026-01-02',
      summary: createBuildingHeatmapSummaryDto(),
      hourly: [createHourlyHeatmapBucketDto()],
      venues: [createVenueHeatmapDto()],
    },
    overrides,
  );
}

//HourlyHeatmapBucketDto
export function createHourlyHeatmapBucketDto(
  overrides: DeepPartial<HourlyHeatmapBucketDto> = {},
): HourlyHeatmapBucketDto {
  return {
    Capacity: 120,
    projected: 45,
    worstCase: 120,
    actual: null,
    projectedUtilisation: 0.375,
    worstCaseUtilisation: 1,
    hour: 10,
    ...overrides,
  };
}

//OccurringEventRow
export function createOccurringEventRow(
  overrides: DeepPartial<OccurringEventRow> = {},
): OccurringEventRow {
  return mergeDeep(
    {
      venueId: 'venue-1',
      eventId: 'event-1',
      linkedHours: [10, 11],
    },
    overrides,
  );
}

//Footprint
export function createFootprint(
  overrides: Partial<GeoJsonPolygon> = {},
): GeoJsonPolygon {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [28.2, -25.7],
        [28.3, -25.7],
        [28.3, -25.8],
        [28.2, -25.7],
      ],
    ],
    ...overrides,
  };
}
