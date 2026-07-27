import {
  type DynamicModule,
  type ForwardReference,
  type INestApplication,
  type Provider,
  type Type,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { AuthGuard } from '../../../../src/auth/auth.guard';
import { RolesGuard } from '../../../../src/auth/roles.guard';
import { DatabaseService } from '../../../../src/db/database.service';
import type * as schema from '../../../../src/entities';
import type { UniRole } from '../../../../src/auth/roles';
import type { SessionData } from '../../../../src/auth/session.decorator';
import type { FlowRuntime, StepDiagnostic } from '../contracts';
import {
  createNestHttpTransport,
  HttpTestClient,
  TestActor,
} from '../http-test-client';
import {
  MockSessionAuthGuard,
  MockSessionRegistry,
  authenticateMockActor,
} from '../session/test-sessions';

type NestImport =
  | Type<unknown>
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference;

export type FocusedHttpRuntimeOptions = {
  readonly imports?: readonly NestImport[];
  readonly controllers?: readonly Type<unknown>[];
  readonly providers?: readonly Provider[];
  readonly sessionStrategy?: 'mock-auth' | 'real-auth';
};

export class FocusedHttpRuntime implements FlowRuntime {
  readonly database;
  readonly http: HttpTestClient;
  readonly mockSessions?: MockSessionRegistry;
  private closed = false;

  private constructor(
    private readonly app: INestApplication,
    private readonly moduleRef: TestingModule,
    private readonly databaseService: DatabaseService,
    http: HttpTestClient,
    mockSessions?: MockSessionRegistry,
  ) {
    this.database = databaseService.db;
    this.http = http;
    this.mockSessions = mockSessions;
  }

  static async create(
    options: FocusedHttpRuntimeOptions,
  ): Promise<FocusedHttpRuntime> {
    const databaseService = await createFreshDatabase();
    let moduleRef: TestingModule | undefined;
    let app: INestApplication | undefined;

    try {
      const authGuard =
        options.sessionStrategy === 'real-auth'
          ? AuthGuard
          : MockSessionAuthGuard;
      moduleRef = await Test.createTestingModule({
        imports: [...(options.imports ?? [])],
        controllers: [...(options.controllers ?? [])],
        providers: [
          ...(options.providers ?? []),
          MockSessionRegistry,
          {
            provide: DatabaseService,
            useValue: databaseService,
          },
          {
            provide: APP_GUARD,
            useClass: authGuard,
          },
          {
            provide: APP_GUARD,
            useClass: RolesGuard,
          },
        ],
      }).compile();

      app = moduleRef.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
      );
      await app.init();
      const http = new HttpTestClient(createNestHttpTransport(app));
      const mockSessions =
        options.sessionStrategy === 'real-auth'
          ? undefined
          : moduleRef.get(MockSessionRegistry);
      return new FocusedHttpRuntime(
        app,
        moduleRef,
        databaseService,
        http,
        mockSessions,
      );
    } catch (error) {
      if (app) await app.close();
      else if (moduleRef) await moduleRef.close();
      else await databaseService.onModuleDestroy();
      throw error;
    }
  }

  createActor(name: string): TestActor {
    return new TestActor(name, this.http.fork());
  }

  authenticateMockActor(
    actor: TestActor,
    session: SessionData,
    universityRoles: Readonly<Record<string, UniRole>> = {},
  ): TestActor {
    if (!this.mockSessions) {
      throw new Error(
        'Focused HTTP runtime was configured with real-auth; mock authentication is unavailable',
      );
    }
    return authenticateMockActor(
      actor,
      this.mockSessions,
      session,
      universityRoles,
    );
  }

  diagnostics(): Promise<StepDiagnostic> {
    return Promise.resolve({
      runtime: 'focused-http',
      database: this.databaseService.dbMode,
      sessionStrategy: this.mockSessions ? 'mock-auth' : 'real-auth',
    });
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.mockSessions?.clear();
    await this.app.close();
  }
}

async function createFreshDatabase(): Promise<DatabaseService> {
  if (process.env.DB_MODE !== 'PGLITE') {
    throw new Error(
      `Focused HTTP integration tests require DB_MODE=PGLITE; received ${process.env.DB_MODE ?? 'undefined'}`,
    );
  }
  if (!process.env.MIGRATIONS_PATH) {
    throw new Error(
      'Focused HTTP integration tests require an absolute MIGRATIONS_PATH',
    );
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
  // Narrow the runtime check once here; DatabaseService remains the injected
  // production instance and exposes its full lifecycle and API.
  void (databaseService.db as PgliteDatabase<typeof schema>);
  return databaseService;
}
