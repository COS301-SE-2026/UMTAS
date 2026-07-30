import { ConflictException } from '@nestjs/common';
import { EventImporter } from './event-importer.service';
import { ModuleResolver } from './module-resolver.service';
import { ParserResultImporter } from './parser-result-importer.service';
import {
  createGroup,
  createModule,
  createParseJob,
  createParsedEventCandidate,
  createParsedModuleCandidate,
  createPdfParserResult,
} from '../Testing/Factories';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  createDbChain,
  mockDbResult,
  mockSequentialResults,
} from '../Testing/Mocks/database.helpers';

describe('ParserResultImporter', () => {
  const job = createParseJob({ UniversityID: 'uni-1' });
  const moduleA = createModule({
    moduleID: 'module-a',
    moduleCode: 'COS101',
  });
  const moduleB = createModule({
    moduleID: 'module-b',
    moduleCode: 'MAT101',
  });

  function harness() {
    const moduleResolver = {
      resolveForUniversity: jest.fn().mockResolvedValue(
        new Map([
          ['COS101', moduleA],
          ['MAT101', moduleB],
        ]),
      ),
    };
    const eventImporter = { createMissingEvents: jest.fn() };
    return {
      moduleResolver,
      eventImporter,
      service: new ParserResultImporter(
        moduleResolver as unknown as ModuleResolver,
        eventImporter as unknown as EventImporter,
      ),
    };
  }

  function result() {
    return createPdfParserResult({
      modules: [
        createParsedModuleCandidate({
          code: ' cos101 ',
          name: 'Computer Science',
        }),
        createParsedModuleCandidate({
          code: 'COS101',
          name: 'duplicate',
        }),
        createParsedModuleCandidate({ code: ' ', name: 'blank' }),
      ],
      events: [
        createParsedEventCandidate({ moduleCode: ' mat101 ' }),
        createParsedEventCandidate({ moduleCode: 'COS101' }),
        createParsedEventCandidate({ moduleCode: '' }),
      ],
    });
  }

  it('normalizes and deduplicates candidates, creates a group, links modules, and delegates events', async () => {
    const h = harness();
    const { mockDb } = createMockDatabase();
    mockDbResult(mockDb.select as jest.Mock, []);
    const groupInsert = createDbChain([createGroup({ GroupID: 'group-1' })]);
    const firstLink = createDbChain([]);
    const secondLink = createDbChain([]);
    (mockDb.insert as jest.Mock)
      .mockReturnValueOnce(groupInsert)
      .mockReturnValueOnce(firstLink)
      .mockReturnValueOnce(secondLink);

    await expect(h.service.importResult(mockDb, job, result())).resolves.toBe(
      'group-1',
    );

    const candidates = h.moduleResolver.resolveForUniversity.mock.calls[0][2];
    expect([...candidates.keys()]).toEqual(['COS101', 'MAT101']);
    expect(candidates.get('MAT101')).toEqual({
      code: 'MAT101',
      name: 'MAT101',
      metadata: {},
      warnings: [],
    });
    expect(firstLink.values).toHaveBeenCalledWith({
      GroupID: 'group-1',
      ModuleID: 'module-a',
    });
    expect(secondLink.values).toHaveBeenCalledWith({
      GroupID: 'group-1',
      ModuleID: 'module-b',
    });
    expect(h.eventImporter.createMissingEvents).toHaveBeenCalledWith(
      mockDb,
      'uni-1',
      result().events,
      expect.any(Map),
    );
  });

  it('creates a grouping without a hash when no usable modules exist', async () => {
    const h = harness();
    h.moduleResolver.resolveForUniversity.mockResolvedValue(new Map());
    const { mockDb } = createMockDatabase();
    mockDbResult(mockDb.insert as jest.Mock, [
      createGroup({ GroupID: 'empty-group' }),
    ]);

    await expect(
      h.service.importResult(mockDb, job, createPdfParserResult()),
    ).resolves.toBe('empty-group');
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it('reuses a group with equivalent membership regardless of row order', async () => {
    const h = harness();
    const { mockDb } = createMockDatabase();
    mockSequentialResults(mockDb.select as jest.Mock, [
      [createGroup({ GroupID: 'existing' })],
      [{ moduleId: 'module-b' }, { moduleId: 'module-a' }],
    ]);

    await expect(h.service.importResult(mockDb, job, result())).resolves.toBe(
      'existing',
    );
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it.each([
    [[{ moduleId: 'module-a' }]],
    [[{ moduleId: 'module-a' }, { moduleId: 'module-a' }]],
  ])(
    'rejects incomplete or duplicate persisted membership %#',
    async (rows) => {
      const h = harness();
      const { mockDb } = createMockDatabase();
      mockSequentialResults(mockDb.select as jest.Mock, [
        [createGroup({ GroupID: 'existing' })],
        rows,
      ]);

      await expect(
        h.service.importResult(mockDb, job, result()),
      ).rejects.toThrow(ConflictException);
      expect(h.eventImporter.createMissingEvents).not.toHaveBeenCalled();
    },
  );

  it('resolves an insertion race by loading and validating the conflicting group', async () => {
    const h = harness();
    const { mockDb } = createMockDatabase();
    mockSequentialResults(mockDb.select as jest.Mock, [
      [],
      [createGroup({ GroupID: 'raced' })],
      [{ moduleId: 'module-a' }, { moduleId: 'module-b' }],
    ]);
    mockDbResult(mockDb.insert as jest.Mock, []);

    await expect(h.service.importResult(mockDb, job, result())).resolves.toBe(
      'raced',
    );
  });

  it('rejects an unresolvable group insertion conflict', async () => {
    const h = harness();
    const { mockDb } = createMockDatabase();
    mockSequentialResults(mockDb.select as jest.Mock, [[], []]);
    mockDbResult(mockDb.insert as jest.Mock, []);

    await expect(h.service.importResult(mockDb, job, result())).rejects.toThrow(
      'PDF parser module grouping could not be created',
    );
  });
});
