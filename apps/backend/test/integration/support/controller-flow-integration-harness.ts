import type {
  DynamicModule,
  ForwardReference,
  Provider,
  Type,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { DatabaseService } from '../../../src/db/database.service';
import type * as schema from '../../../src/entities';

type NestImport =
  | Type<unknown>
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference;

export type ControllerFlowIntegrationTestOptions = {
  imports?: NestImport[];
  controllers: Type<unknown>[];
  providers?: Provider[];
};

export type ControllerFlowIntegrationTest = {
  readonly db: PgliteDatabase<typeof schema>;
  get<T>(controller: Type<T>): T;
  close(): Promise<void>;
};

/**
 * Creates the supported controller-flow integration-test shape:
 * real controllers and services backed by a fresh, migrated PGLite database.
 *
 * The test owns scenario setup. Insert prerequisite rows through `db`, create
 * DTO instances in the test, then invoke one or more controllers through
 * `get()`.
 */
export async function createControllerFlowIntegrationTest(
  options: ControllerFlowIntegrationTestOptions,
): Promise<ControllerFlowIntegrationTest> {
  if (options.controllers.length === 0) {
    throw new Error(
      'A controller-flow integration test must exercise at least one controller',
    );
  }

  const database = await createFreshDatabase();
  let moduleRef: TestingModule | undefined;

  try {
    moduleRef = await Test.createTestingModule({
      imports: options.imports ?? [],
      controllers: options.controllers,
      providers: [
        ...(options.providers ?? []),
        {
          provide: DatabaseService,
          useValue: database.databaseService,
        },
      ],
    }).compile();

    let closed = false;
    return {
      db: database.db,
      get<T>(controller: Type<T>): T {
        return moduleRef!.get(controller);
      },
      async close(): Promise<void> {
        if (closed) return;
        closed = true;
        await moduleRef?.close();
      },
    };
  } catch (error) {
    if (moduleRef) {
      await moduleRef.close();
    } else {
      await database.close();
    }
    throw error;
  }
}

type FreshDatabase = {
  readonly db: PgliteDatabase<typeof schema>;
  readonly databaseService: DatabaseService;
  close(): Promise<void>;
};

async function createFreshDatabase(): Promise<FreshDatabase> {
  if (process.env.DB_MODE !== 'PGLITE') {
    throw new Error(
      `Integration tests require DB_MODE=PGLITE; received ${process.env.DB_MODE ?? 'undefined'}`,
    );
  }

  if (!process.env.MIGRATIONS_PATH) {
    throw new Error('Integration tests require an absolute MIGRATIONS_PATH');
  }

  const databaseService = new DatabaseService();
  try {
    await databaseService.onApplicationBootstrap();
  } catch (error) {
    await databaseService.onModuleDestroy();
    throw error;
  }

  if (!databaseService.pglite) {
    await databaseService.onModuleDestroy();
    throw new Error('PGLite did not initialize');
  }

  let closed = false;
  return {
    db: databaseService.db as PgliteDatabase<typeof schema>,
    databaseService,
    async close(): Promise<void> {
      if (closed) return;
      closed = true;
      await databaseService.onModuleDestroy();
    },
  };
}
