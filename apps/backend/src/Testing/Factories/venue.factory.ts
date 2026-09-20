import { randomUUID } from 'node:crypto';
import type {
  BaseVenueDto,
  CreateVenueInput,
  VenueListResponseDto,
  VenueSingleResponseDto,
} from '../../Venue/dto/venue.dto';
import { Venue } from '../../entities';
import { mergeDeep, type DeepPartial } from './factory.util';

//Venue Entity
type VenueEntity = typeof Venue.$inferSelect;

export function createVenue(overrides: Partial<VenueEntity> = {}): VenueEntity {
  return {
    VenueID: randomUUID(),
    VenueName: 'Main Lecture Hall',
    UniversityID: randomUUID(),
    BuildingID: null,
    Capacity: 0,
    ...overrides,
  };
}

//Venue Input
export function createVenueInput(
  overrides: Partial<CreateVenueInput> = {},
): CreateVenueInput {
  return {
    VenueName: 'Main Lecture Hall',
    UniversityID: randomUUID(),
    BuildingID: null,
    Capacity: 0,
    ...overrides,
  };
} //END_createVenueInput

//Venue Dto
export function createVenueDto(
  overrides: DeepPartial<BaseVenueDto> = {},
): BaseVenueDto {
  return mergeDeep(
    {
      VenueID: '00000000-0000-4000-0000-000000000011',
      VenueName: 'Main Lecture Hall',
      UniversityID: '00000000-0000-4000-0000-000000000002',
      BuildingID: null,
      Capacity: 0,
    },
    overrides,
  );
} //END_createVenueDto

//Single Response
export function createVenueSingleResponse(
  overrides: DeepPartial<VenueSingleResponseDto> = {},
): VenueSingleResponseDto {
  return mergeDeep(
    {
      venue: createVenueDto(),
    },
    overrides,
  );
} //END_createVenueSingleResponse

//List Resopnse
export function createVenueListResponse(
  overrides: DeepPartial<VenueListResponseDto> = {},
): VenueListResponseDto {
  return mergeDeep(
    {
      venues: [createVenueDto()],
    },
    overrides,
  );
} //END_createVenueListResponse
