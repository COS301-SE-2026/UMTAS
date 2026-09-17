import { randomUUID } from 'crypto';
import { VenueHeatmapDto } from 'src/Building/dto/heatmap.dto';
import { Building } from 'src/entities';

type BuildingEntity = typeof Building.$inferSelect;

export function createBuilding(
  overrides: Partial<BuildingEntity> = {},
): BuildingEntity {
  return {
    BuildingID: randomUUID(),
    UniversityID: randomUUID(),
    BuildingName: 'Test building',
    //coords more or less for IT Building
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

export function createVenueHeatmap(
  overrides: Partial<VenueHeatmapDto> = {},
): VenueHeatmapDto {
  return {
    VenueID: randomUUID(),
    VenueName: 'Test Venue',
    Capacity: 100,
    projected: 50,
    worstCase: 90,
    actual: 20,
    projectedUtilisation: 0.5,
    worstCaseUtilisation: 0.9,
    hourly: [],

    ...overrides,
  };
} //END_createVenueHeatmap
