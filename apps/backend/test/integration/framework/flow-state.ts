export type FlowStateEntry<T = unknown> = {
  readonly producer: string;
  readonly value: T;
};

export class MissingFlowOutputError extends Error {
  constructor(
    readonly consumer: string,
    readonly key: string,
  ) {
    super(`Step "${consumer}" requires missing flow output "${key}"`);
    this.name = MissingFlowOutputError.name;
  }
}

export class DuplicateFlowOutputError extends Error {
  constructor(
    readonly key: string,
    readonly existingProducer: string,
    readonly attemptedProducer: string,
  ) {
    super(
      `Flow output "${key}" was already published by "${existingProducer}" and cannot be republished by "${attemptedProducer}"`,
    );
    this.name = DuplicateFlowOutputError.name;
  }
}

export class FlowState {
  private readonly entries = new Map<string, FlowStateEntry>();

  publish<T>(key: string, value: T, producer: string): T {
    const existing = this.entries.get(key);
    if (existing) {
      throw new DuplicateFlowOutputError(key, existing.producer, producer);
    }
    this.entries.set(key, { producer, value });
    return value;
  }

  require<T>(key: string, consumer: string): T {
    const entry = this.entries.get(key);
    if (!entry) throw new MissingFlowOutputError(consumer, key);
    return entry.value as T;
  }

  get<T>(key: string): T | undefined {
    return this.entries.get(key)?.value as T | undefined;
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  snapshot(): Readonly<Record<string, { producer: string }>> {
    return Object.fromEntries(
      [...this.entries].map(([key, entry]) => [
        key,
        { producer: entry.producer },
      ]),
    );
  }

  clear(): void {
    this.entries.clear();
  }
}
