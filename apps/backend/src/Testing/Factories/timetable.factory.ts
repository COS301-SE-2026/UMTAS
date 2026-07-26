import { randomUUID } from 'crypto';
import { Timetable } from '../../entities';
import {
  CreateTimetableDto,
  UpdateTimetableDto,
} from '../../Timetable/dto/timetable.dto';

const TIMETABLE_NAME: string = 'TEST_TIMETABLE_NAME';

type Timetable = typeof Timetable.$inferSelect;

export function createTimetable(overrides: Partial<Timetable> = {}): Timetable {
  return {
    timetableID: randomUUID(),
    timetableName: TIMETABLE_NAME,

    ...overrides,
  };
} //END_createTimetable

export function createCreateTimetableDto(
  overrides: Partial<CreateTimetableDto> = {},
): CreateTimetableDto {
  return {
    timetableName: TIMETABLE_NAME,
    eventIds: [randomUUID(), randomUUID()],

    ...overrides,
  };
} //END_createCreateTimetableDto

export function createUpdateTimetableDto(
  overrides: Partial<UpdateTimetableDto>,
): UpdateTimetableDto {
  return {
    timetableName: TIMETABLE_NAME,
    addEventIds: [randomUUID()],
    removeEventIds: [randomUUID()],

    ...overrides,
  };
} //END_createUpdateTimetableDto
