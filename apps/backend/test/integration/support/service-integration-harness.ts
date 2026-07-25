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

export type ServiceIntegrationTestOptions = {
  imports?: NestImport[];
  controllers: Type<unknown>[];
  providers?: Provider[];
};

export type ServiceIntegrationTest = {
  readonly db: PgliteDatabase<typeof schema>;
  get<T>(controller: Type<T>): T;
  close(): Promise<void>;
};

/**
 * Creates the only supported backend integration-test shape:
 * real controllers and services backed by a fresh, migrated PGLite database.
 *
 * The test owns scenario setup. Insert prerequisite rows through `db`, create
 * DTO instances in the test, then invoke one or more controllers through
 * `get()`.
 */
export async function createServiceIntegrationTest(
  options: ServiceIntegrationTestOptions,
): Promise<ServiceIntegrationTest> {
  if (options.controllers.length === 0) {
    throw new Error(
      'A service integration test must exercise at least one controller',
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
          useValue: {
            db: database.db,
            dbMode: 'PGLITE',
          } as DatabaseService,
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
        await database.close();
      },
    };
  } catch (error) {
    await moduleRef?.close();
    await database.close();
    throw error;
  }
}

type FreshDatabase = {
  readonly db: PgliteDatabase<typeof schema>;
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
  await databaseService.onApplicationBootstrap();

  if (!databaseService.pglite) {
    throw new Error('PGLite did not initialize');
  }

  let closed = false;
  return {
    db: databaseService.db,
    async close(): Promise<void> {
      if (closed) return;
      closed = true;
      await databaseService.onModuleDestroy();
    },
  };
}
