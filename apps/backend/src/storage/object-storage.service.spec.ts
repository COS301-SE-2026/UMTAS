import { ConfigService } from '@nestjs/config';
import { ObjectStorageService } from './object-storage.service';
import type { ObjectStorageClient } from './object-storage.service';

class TestConfigService {
  constructor(private readonly env: Record<string, string>) {}

  get<T = string>(key: string): T | undefined {
    return this.env[key] as T | undefined;
  }
}

function createConfigService(env: Record<string, string>): ConfigService {
  return new TestConfigService(env) as unknown as ConfigService;
}

function createClient(
  handleCommand: (commandName: string) => unknown = () => ({}),
): { calls: string[]; client: ObjectStorageClient } {
  const calls: string[] = [];

  return {
    calls,
    client: {
      send: (command) => {
        const commandName = command.constructor.name;
        calls.push(commandName);
        return Promise.resolve().then(() => handleCommand(commandName));
      },
    },
  };
}

function missingBucketError(): Error {
  return Object.assign(new Error('Bucket not found'), {
    name: 'NotFound',
    $metadata: { httpStatusCode: 404 },
  });
}

describe('ObjectStorageService', () => {
  it('creates the configured bucket when it does not exist', async () => {
    const { calls, client } = createClient((commandName) => {
      if (commandName === 'HeadBucketCommand') {
        throw missingBucketError();
      }

      return {};
    });

    const service = new ObjectStorageService(
      createConfigService({ MINIO_BUCKET: 'umtas-uploads' }),
      client,
    );

    await service.onModuleInit();

    expect(calls).toEqual(['HeadBucketCommand', 'CreateBucketCommand']);
  });

  it('does not create the bucket when it already exists', async () => {
    const { calls, client } = createClient();

    const service = new ObjectStorageService(
      createConfigService({ MINIO_BUCKET: 'umtas-uploads' }),
      client,
    );

    await service.onModuleInit();

    expect(calls).toEqual(['HeadBucketCommand']);
  });

  it('skips setup when no bucket is configured', async () => {
    const { calls, client } = createClient();

    const service = new ObjectStorageService(createConfigService({}), client);

    await service.onModuleInit();

    expect(calls).toEqual([]);
  });
});
