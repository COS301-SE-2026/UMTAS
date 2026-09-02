import { randomUUID } from 'crypto';
import { Route } from 'src/entities';

type RouteEntity = typeof Route.$inferSelect;

export function createRoute(overrides: Partial<RouteEntity> = {}): RouteEntity {
  return {
    RouteID: randomUUID(),
    UniversityID: randomUUID(),
    OriginBuildingID: randomUUID(),
    DestinationBuildingID: randomUUID(),
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
