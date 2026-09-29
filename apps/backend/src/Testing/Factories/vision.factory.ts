// src/Testing/Factories/vision.factory.ts
import { randomUUID } from 'node:crypto';
import { VisionSession } from '../../entities';
import {
  CreateVisionSessionInput,
  SessionInferenceResult,
  UpdateVisionSessionDto,
  VisionSessionDto,
  VisionSessionQueryDto,
} from 'src/Vision/dto';
import { moduleId } from '../constants';

type VisionSessionEntity = typeof VisionSession.$inferSelect;

//createVisionSession
export function createVisionSession(
  overrides: Partial<VisionSessionEntity> = {},
): VisionSessionEntity {
  return {
    SessionID: randomUUID(),
    ModuleID: randomUUID(),
    EventID: null,
    Date: '2026-12-01',
    SessionName: 'Test Session',
    SessionDsc: null,
    Data: {
      questions_asked: 0,
      total_restless_frames: 0,
      total_stable_frames: 0,
      total_paying_attention: 0,
      total_no_attention: 0,
      total_frames: 0,
    },
    CreatedBy: null,
    CreatedAt: new Date(),
    ...overrides,
  };
} //END_createVisionSession

//createCreateVisionSessionInput
export function createCreateVisionSessionInput(
  overrides: Partial<CreateVisionSessionInput> = {},
): CreateVisionSessionInput {
  return {
    ModuleID: randomUUID(),
    EventID: null,
    Date: '2026-12-01',
    SessionName: 'Test Session',
    SessionDsc: null,
    Data: createSessionInferenceResult(),
    CreatedBy: randomUUID(),
    ...overrides,
  };
} //END_createCreateVisionSessionInput

//createSessionInferenceResult
export function createSessionInferenceResult(
  overrides: Partial<SessionInferenceResult> = {},
): SessionInferenceResult {
  return {
    questions_asked: 0,
    total_restless_frames: 0,
    total_stable_frames: 0,
    total_paying_attention: 0,
    total_no_attention: 0,
    total_frames: 0,
    ...overrides,
  };
} //END_createSessionInferenceResult

//createVisionSessionQueryDto
export function createVisionSessionQueryDto(
  overrides: Partial<VisionSessionQueryDto> = {},
): VisionSessionQueryDto {
  return {
    ...overrides,
  };
} //END_createVisionSessionQueryDto

export function createVisionSessionDto(
  overrides: Partial<VisionSessionDto> = {},
): VisionSessionDto {
  return {
    SessionID: 'session-1',
    ModuleID: moduleId,
    EventID: null,
    Date: '2026-12-15',
    SessionName: 'Test Session',
    SessionDsc: null,
    Data: createSessionInferenceResult(),
    CreatedBy: null,
    CreatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createUpdateVisionSessionDto(
  overrides: Partial<UpdateVisionSessionDto> = {},
): UpdateVisionSessionDto {
  return {
    ...overrides,
  };
}
