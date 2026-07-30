import { ModuleResolver } from './module-resolver.service';
import {
  createModule,
  createParsedModuleCandidate,
} from '../Testing/Factories';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  createDbChain,
  mockDbResult,
  mockSequentialResults,
} from '../Testing/Mocks/database.helpers';

describe('ModuleResolver', () => {
  const service = new ModuleResolver();
  const existing = createModule({
    moduleID: 'existing-id',
    moduleCode: 'COS101',
    moduleName: 'Existing',
  });

  it('returns an empty map without querying for empty candidates', async () => {
    const { mockDb } = createMockDatabase();
    await expect(
      service.resolveForUniversity(mockDb, 'uni-1', new Map()),
    ).resolves.toEqual(new Map());
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('reuses university-linked modules and ignores duplicate query rows', async () => {
    const { mockDb } = createMockDatabase();
    mockDbResult(mockDb.select as jest.Mock, [
      { module: existing },
      { module: existing },
    ]);
    const result = await service.resolveForUniversity(
      mockDb,
      'uni-1',
      new Map([['COS101', createParsedModuleCandidate({ code: 'cos101' })]]),
    );
    expect(result).toEqual(new Map([['COS101', existing]]));
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('creates missing modules with normalized fallbacks, truncation, and metadata', async () => {
    const { mockDb } = createMockDatabase();
    const created = createModule({
      moduleID: 'new-id',
      moduleCode: 'MAT101',
      moduleName: 'M'.repeat(256),
    });
    mockDbResult(mockDb.select as jest.Mock, []);
    const insert = createDbChain([created]);
    (mockDb.insert as jest.Mock).mockReturnValue(insert);

    const result = await service.resolveForUniversity(
      mockDb,
      'uni-1',
      new Map([
        [
          ' mat101 ',
          createParsedModuleCandidate({
            code: ' mat101 ',
            name: ` ${'M'.repeat(300)} `,
            metadata: { semester: 1 },
          }),
        ],
      ]),
    );

    expect(insert.values).toHaveBeenCalledWith({
      moduleCode: 'MAT101',
      moduleName: 'M'.repeat(256),
      moduleDescription: '{"semester":1}',
      validated: false,
    });
    expect(result.get('MAT101')).toBe(created);
  });

  it('uses the code as name and serializes empty metadata', async () => {
    const { mockDb } = createMockDatabase();
    const created = createModule({ ...existing, moduleCode: 'PHY101' });
    mockDbResult(mockDb.select as jest.Mock, []);
    const insert = createDbChain([created]);
    (mockDb.insert as jest.Mock).mockReturnValue(insert);

    await service.resolveForUniversity(
      mockDb,
      'uni-1',
      new Map([
        [
          'PHY101',
          createParsedModuleCandidate({
            code: 'PHY101',
            name: null,
            metadata: {},
          }),
        ],
      ]),
    );
    expect(insert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleCode: 'PHY101',
        moduleName: 'PHY101',
        moduleDescription: '{}',
      }),
    );
  });

  it('falls back to an existing module after an insert conflict', async () => {
    const { mockDb } = createMockDatabase();
    const raced = createModule({ ...existing, moduleCode: 'STA101' });
    mockSequentialResults(mockDb.select as jest.Mock, [[], [raced]]);
    mockDbResult(mockDb.insert as jest.Mock, []);

    await expect(
      service.resolveForUniversity(
        mockDb,
        'uni-1',
        new Map([['STA101', createParsedModuleCandidate({ code: 'STA101' })]]),
      ),
    ).resolves.toEqual(new Map([['STA101', raced]]));
  });

  it('rejects an insert conflict when no module can be resolved', async () => {
    const { mockDb } = createMockDatabase();
    mockSequentialResults(mockDb.select as jest.Mock, [[], []]);
    mockDbResult(mockDb.insert as jest.Mock, []);

    await expect(
      service.resolveForUniversity(
        mockDb,
        'uni-1',
        new Map([['STA101', createParsedModuleCandidate({ code: 'STA101' })]]),
      ),
    ).rejects.toThrow('PDF parser module could not be resolved: STA101');
  });

  it('does not reuse a module absent from the university-scoped query', async () => {
    const { mockDb } = createMockDatabase();
    const otherUniversityModule = createModule({
      ...existing,
      moduleCode: 'LAW101',
    });
    mockDbResult(mockDb.select as jest.Mock, []);
    mockDbResult(mockDb.insert as jest.Mock, [otherUniversityModule]);

    const result = await service.resolveForUniversity(
      mockDb,
      'uni-1',
      new Map([['LAW101', createParsedModuleCandidate({ code: 'LAW101' })]]),
    );
    expect(mockDb.insert).toHaveBeenCalled();
    expect(result.get('LAW101')).toBe(otherUniversityModule);
  });
});
