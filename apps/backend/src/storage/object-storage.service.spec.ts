import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ObjectStorageService } from './object-storage.service';
import type { ObjectStorageClient } from './object-storage.service';

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation((config) => ({
      config,
      send: jest.fn(),
    })),
  };
});

function createClient(
  handleCommand: (command: unknown) => unknown = () => ({}),
): { commands: unknown[]; client: ObjectStorageClient } {
  const commands: unknown[] = [];

  return {
    commands,
    client: {
      send: (command) => {
        commands.push(command);
        return Promise.resolve().then(() => handleCommand(command));
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

function rejectWith(reason: unknown): Promise<never> {
  // The service must propagate even malformed rejection reasons from SDK clients.
  // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
  return Promise.reject(reason);
}

describe('ObjectStorageService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('creates the configured bucket when it does not exist', async () => {
    const { commands, client } = createClient((command) => {
      if (command instanceof HeadBucketCommand) {
        throw missingBucketError();
      }

      return {};
    });

    const service = new ObjectStorageService(client);

    await service.onModuleInit();

    expect(commands.map((command) => command?.constructor.name)).toEqual([
      'HeadBucketCommand',
      'CreateBucketCommand',
    ]);
  });

  it('does not create the bucket when it already exists', async () => {
    const { commands, client } = createClient();

    const service = new ObjectStorageService(client);

    await service.onModuleInit();

    expect(commands).toHaveLength(1);
    expect(commands[0]).toBeInstanceOf(HeadBucketCommand);
  });

  it('skips startup checks when bucket creation is disabled', async () => {
    process.env.MINIO_CREATE_BUCKET_ON_STARTUP = 'false';
    const { commands, client } = createClient();
    await new ObjectStorageService(client).onModuleInit();
    expect(commands).toEqual([]);
  });

  it.each([
    { $metadata: { httpStatusCode: 404 } },
    { name: 'NotFound' },
    { name: 'NoSuchBucket' },
    { name: 'NotFoundError' },
  ])('creates a missing bucket for supported error %#', async (error) => {
    const { commands, client } = createClient((command) => {
      if (command instanceof HeadBucketCommand) return rejectWith(error);
      return {};
    });
    await new ObjectStorageService(client).ensureBucketExists();
    expect(commands[1]).toBeInstanceOf(CreateBucketCommand);
  });

  it.each([
    new Error('access denied'),
    'primitive',
    null,
    42,
    {},
    { name: 123 },
    { $metadata: { httpStatusCode: '404' } },
  ])('propagates non-missing or malformed error %#', async (error) => {
    const { client } = createClient(() => rejectWith(error));
    await expect(
      new ObjectStorageService(client).ensureBucketExists(),
    ).rejects.toBe(error);
  });

  it('propagates bucket creation failures', async () => {
    const creationError = new Error('create denied');
    const { client } = createClient((command) => {
      if (command instanceof HeadBucketCommand) throw missingBucketError();
      throw creationError;
    });
    await expect(
      new ObjectStorageService(client).ensureBucketExists(),
    ).rejects.toBe(creationError);
  });

  it('puts an object with exact command fields and returns its location', async () => {
    process.env.MINIO_BUCKET = 'configured-bucket';
    const { commands, client } = createClient();
    const body = Buffer.from('contents');
    await expect(
      new ObjectStorageService(client).putObject({
        key: 'folder/file.pdf',
        body,
        contentType: 'application/pdf',
      }),
    ).resolves.toEqual({
      bucket: 'configured-bucket',
      key: 'folder/file.pdf',
    });
    expect(commands[0]).toBeInstanceOf(PutObjectCommand);
    expect((commands[0] as PutObjectCommand).input).toEqual({
      Bucket: 'configured-bucket',
      Key: 'folder/file.pdf',
      Body: body,
      ContentLength: body.byteLength,
      ContentType: 'application/pdf',
    });
  });

  it('uses the default bucket and leaves content type undefined', async () => {
    delete process.env.MINIO_BUCKET;
    const { commands, client } = createClient();
    const body = new Uint8Array([1, 2, 3]);
    await new ObjectStorageService(client).putObject({ key: 'raw', body });
    expect((commands[0] as PutObjectCommand).input).toMatchObject({
      Bucket: 'umtas-uploads',
      ContentLength: 3,
      ContentType: undefined,
    });
  });

  it.each([
    [{}, { region: 'us-east-1', forcePathStyle: true }],
    [
      { MINIO_ENDPOINT: 'http://minio:9000' },
      {
        region: 'us-east-1',
        forcePathStyle: true,
        endpoint: 'http://minio:9000',
      },
    ],
    [
      { MINIO_ROOT_USER: 'user', MINIO_ROOT_PASSWORD: 'secret' },
      {
        credentials: { accessKeyId: 'user', secretAccessKey: 'secret' },
      },
    ],
    [
      { MINIO_ROOT_USER: 'user' },
      { credentials: { accessKeyId: 'user', secretAccessKey: '' } },
    ],
    [
      { MINIO_ROOT_PASSWORD: 'secret' },
      { credentials: { accessKeyId: '', secretAccessKey: 'secret' } },
    ],
  ])('constructs the default S3 client configuration %#', (env, expected) => {
    Object.assign(process.env, env);
    new ObjectStorageService();
    expect(jest.mocked(S3Client)).toHaveBeenCalledWith(
      expect.objectContaining(expected),
    );
  });
});
