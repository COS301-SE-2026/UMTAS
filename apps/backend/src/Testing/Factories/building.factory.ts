import { randomUUID } from 'crypto';
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
}
