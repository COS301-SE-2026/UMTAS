import type { AppDatabase } from '../../../../src/db/database.service';

export type SeedOwner =
  | { readonly kind: 'seed' }
  | { readonly kind: 'step'; readonly step: string }
  | { readonly kind: 'external-worker'; readonly worker: string };

export type SeedRecord<T = unknown> = {
  readonly key: string;
  readonly owner: SeedOwner;
  readonly dependencies: readonly string[];
  readonly identity?: string;
  readonly persist?: (db: AppDatabase) => Promise<T>;
};

export class SeedManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = SeedManifestError.name;
  }
}

export class SeedCollector {
  private readonly records = new Map<string, SeedRecord>();
  private readonly identities = new Map<string, string>();

  seed<T>(
    key: string,
    persist: (db: AppDatabase) => Promise<T>,
    options: {
      dependencies?: readonly string[];
      identity?: string;
    } = {},
  ): void {
    this.register({
      key,
      owner: { kind: 'seed' },
      dependencies: options.dependencies ?? [],
      identity: options.identity,
      persist,
    });
  }

  producedByStep(
    key: string,
    step: string,
    dependencies: readonly string[] = [],
  ): void {
    this.register({
      key,
      owner: { kind: 'step', step },
      dependencies,
    });
  }

  producedByWorker(
    key: string,
    worker: string,
    dependencies: readonly string[] = [],
  ): void {
    this.register({
      key,
      owner: { kind: 'external-worker', worker },
      dependencies,
    });
  }

  register(record: SeedRecord): void {
    const existing = this.records.get(record.key);
    if (existing) {
      throw new SeedManifestError(
        `Seed record "${record.key}" has duplicate ownership (${formatOwner(existing.owner)} and ${formatOwner(record.owner)})`,
      );
    }
    if (record.owner.kind === 'seed' && !record.persist) {
      throw new SeedManifestError(
        `Seed-owned record "${record.key}" requires a persistence function`,
      );
    }
    if (record.owner.kind !== 'seed' && record.persist) {
      throw new SeedManifestError(
        `Producer-owned record "${record.key}" cannot define seed persistence`,
      );
    }
    if (record.identity) {
      const identityOwner = this.identities.get(record.identity);
      if (identityOwner) {
        throw new SeedManifestError(
          `Seed identity "${record.identity}" is shared by "${identityOwner}" and "${record.key}"`,
        );
      }
      this.identities.set(record.identity, record.key);
    }
    this.records.set(record.key, record);
  }

  manifest(): SeedManifest {
    return new SeedManifest([...this.records.values()]);
  }
}

export class SeedManifest {
  private readonly byKey: ReadonlyMap<string, SeedRecord>;
  private readonly orderedRecords: readonly SeedRecord[];

  constructor(records: readonly SeedRecord[]) {
    this.byKey = new Map(records.map((record) => [record.key, record]));
    this.orderedRecords = this.validateAndOrder(records);
  }

  records(): readonly SeedRecord[] {
    return this.orderedRecords;
  }

  ownerOf(key: string): SeedOwner | undefined {
    return this.byKey.get(key)?.owner;
  }

  summary(): Readonly<Record<string, string>> {
    return Object.fromEntries(
      this.orderedRecords.map((record) => [
        record.key,
        formatOwner(record.owner),
      ]),
    );
  }

  validateStepProducers(stepNames: readonly string[]): void {
    const stepIndexes = new Map(
      stepNames.map((stepName, index) => [stepName, index]),
    );
    for (const record of this.orderedRecords) {
      if (record.owner.kind !== 'step') continue;
      const ownerIndex = stepIndexes.get(record.owner.step);
      if (ownerIndex === undefined) {
        throw new SeedManifestError(
          `Record "${record.key}" references missing producer step "${record.owner.step}"`,
        );
      }
      for (const dependency of record.dependencies) {
        const dependencyOwner = this.byKey.get(dependency)!.owner;
        if (dependencyOwner.kind !== 'step') continue;
        const dependencyIndex = stepIndexes.get(dependencyOwner.step);
        if (dependencyIndex === undefined) {
          throw new SeedManifestError(
            `Record "${record.key}" depends on missing producer step "${dependencyOwner.step}"`,
          );
        }
        if (dependencyIndex > ownerIndex) {
          throw new SeedManifestError(
            `Step "${record.owner.step}" produces "${record.key}" before dependency "${dependency}" from later step "${dependencyOwner.step}"`,
          );
        }
      }
    }
  }

  validateStepOutputs(
    steps: readonly {
      readonly name: string;
      readonly outputKey?: string;
    }[],
  ): void {
    const outputOwners = new Map<string, string>();
    for (const step of steps) {
      if (!step.outputKey) continue;

      const existingOwner = outputOwners.get(step.outputKey);
      if (existingOwner) {
        throw new SeedManifestError(
          `Flow output "${step.outputKey}" is published by both "${existingOwner}" and "${step.name}"`,
        );
      }
      outputOwners.set(step.outputKey, step.name);

      const record = this.byKey.get(step.outputKey);
      if (!record) {
        throw new SeedManifestError(
          `Step "${step.name}" publishes undeclared flow output "${step.outputKey}"`,
        );
      }
      if (record.owner.kind !== 'step' || record.owner.step !== step.name) {
        throw new SeedManifestError(
          `Step "${step.name}" publishes "${step.outputKey}", but the manifest assigns it to ${formatOwner(record.owner)}`,
        );
      }
    }
  }

  async persist(db: AppDatabase): Promise<Map<string, unknown>> {
    const persisted = new Map<string, unknown>();
    await db.transaction(async (tx: AppDatabase) => {
      for (const record of this.orderedRecords) {
        if (record.owner.kind !== 'seed') continue;
        persisted.set(record.key, await record.persist!(tx));
      }
    });
    return persisted;
  }

  private validateAndOrder(
    records: readonly SeedRecord[],
  ): readonly SeedRecord[] {
    for (const record of records) {
      for (const dependency of record.dependencies) {
        const dependencyRecord = this.byKey.get(dependency);
        if (!dependencyRecord) {
          throw new SeedManifestError(
            `Seed record "${record.key}" requires missing producer "${dependency}"`,
          );
        }
        if (
          record.owner.kind === 'seed' &&
          dependencyRecord.owner.kind !== 'seed'
        ) {
          throw new SeedManifestError(
            `Seed-owned record "${record.key}" cannot reference ${formatOwner(dependencyRecord.owner)} record "${dependency}" before flow execution`,
          );
        }
      }
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const ordered: SeedRecord[] = [];

    const visit = (record: SeedRecord): void => {
      if (visited.has(record.key)) return;
      if (visiting.has(record.key)) {
        throw new SeedManifestError(
          `Seed dependency cycle includes "${record.key}"`,
        );
      }
      visiting.add(record.key);
      for (const dependency of record.dependencies) {
        visit(this.byKey.get(dependency)!);
      }
      visiting.delete(record.key);
      visited.add(record.key);
      ordered.push(record);
    };

    for (const record of records) visit(record);
    return ordered;
  }
}

function formatOwner(owner: SeedOwner): string {
  switch (owner.kind) {
    case 'seed':
      return 'seed';
    case 'step':
      return `step:${owner.step}`;
    case 'external-worker':
      return `external-worker:${owner.worker}`;
  }
}
