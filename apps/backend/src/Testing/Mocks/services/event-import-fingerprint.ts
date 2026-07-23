import { EventImportFingerprintService } from '../../../Events/event-import-fingerprint.service';

export function createMockEventImportFingerprintService() {
  const mockEventFingerprintService: Partial<
    jest.Mocked<EventImportFingerprintService>
  > = {
    buildForEvent: jest.fn(),
    buildForModuleEvent: jest.fn(),

    //helpertjies
  };

  return {
    mockEventFingerprintService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockBuilderService
