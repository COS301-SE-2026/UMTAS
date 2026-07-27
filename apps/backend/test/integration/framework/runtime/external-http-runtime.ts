import type { AppDatabase } from '../../../../src/db/database.service';
import type { FlowRuntime, StepDiagnostic } from '../contracts';
import {
  createFetchHttpTransport,
  HttpTestClient,
  TestActor,
} from '../http-test-client';

export type ExternalHttpRuntimeOptions = {
  readonly baseUrl: string;
  readonly database: AppDatabase;
  readonly initialize?: () => Promise<void>;
  readonly diagnostics?: () => Promise<StepDiagnostic>;
  readonly close?: () => Promise<void>;
};

export class ExternalHttpRuntime implements FlowRuntime {
  readonly database: AppDatabase;
  readonly http: HttpTestClient;
  private closed = false;

  constructor(private readonly options: ExternalHttpRuntimeOptions) {
    this.database = options.database;
    this.http = new HttpTestClient(createFetchHttpTransport(options.baseUrl));
  }

  async initialize(): Promise<void> {
    await this.options.initialize?.();
  }

  createActor(name: string): TestActor {
    return new TestActor(name, this.http.fork());
  }

  async diagnostics(): Promise<StepDiagnostic> {
    return (
      (await this.options.diagnostics?.()) ?? {
        runtime: 'external-http',
        baseUrl: this.options.baseUrl,
      }
    );
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await this.options.close?.();
  }
}
