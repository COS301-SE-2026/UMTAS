import { randomUUID } from 'crypto';
import { Venue } from '../../entities';
import { CreateVenueInput } from '../../Venue/dto/venue.dto';

const VENUE_NAME: string = 'Main Lecture Hall';
const DEFAULT_CAPACITY: number = 0;

type Venue = typeof Venue.$inferSelect;

export function createVenue(overrides: Partial<Venue> = {}): Venue {
  return {
    VenueID: randomUUID(),
    VenueName: VENUE_NAME,
    UniversityID: randomUUID(),
    BuildingID: null,
    Capacity: DEFAULT_CAPACITY,

    ...overrides,
  };
} //END_createVenue

export function createVenueInput(
  overrides: Partial<CreateVenueInput> = {},
): CreateVenueInput {
  return {
    VenueName: VENUE_NAME,
    UniversityID: randomUUID(),
    BuildingID: null,
    Capacity: DEFAULT_CAPACITY,

    ...overrides,
  };
} //END_createVenueInput
