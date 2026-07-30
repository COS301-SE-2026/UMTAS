import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';

export interface ObjectStorageClient {
  send(
    command: HeadBucketCommand | CreateBucketCommand | PutObjectCommand,
  ): Promise<unknown>;
}

export const OBJECT_STORAGE_CLIENT = Symbol('OBJECT_STORAGE_CLIENT');

@Injectable()
export class ObjectStorageService implements OnModuleInit {
  private readonly logger = new Logger(ObjectStorageService.name);
  private readonly client: ObjectStorageClient;
  private readonly bucket = process.env.MINIO_BUCKET ?? 'umtas-uploads';
  private readonly createBucketOnStartup =
    process.env.MINIO_CREATE_BUCKET_ON_STARTUP !== 'false';

  constructor(
    @Optional()
    @Inject(OBJECT_STORAGE_CLIENT)
    client?: ObjectStorageClient,
  ) {
    this.client = client ?? new S3Client(buildS3ClientConfig());
  }

  async onModuleInit(): Promise<void> {
    if (!this.createBucketOnStartup) {
      this.logger.log('Object storage bucket creation is disabled');
      return;
    }

    await this.ensureBucketExists();
  }

  async ensureBucketExists(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Object storage bucket is ready: ${this.bucket}`);
    } catch (error) {
      if (isMissingBucketError(error)) {
        await this.createBucket();
        return;
      }

      throw error;
    }
  }

  async putObject(options: {
    key: string;
    body: Buffer | Uint8Array;
    contentType?: string;
  }): Promise<{ bucket: string; key: string }> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: options.key,
        Body: options.body,
        ContentLength: options.body.byteLength,
        ContentType: options.contentType,
      }),
    );

    return { bucket: this.bucket, key: options.key };
  }

  private async createBucket(): Promise<void> {
    await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    this.logger.log(`Created object storage bucket: ${this.bucket}`);
  }
}

function buildS3ClientConfig(): S3ClientConfig {
  const config: S3ClientConfig = {
    region: 'us-east-1',
    forcePathStyle: true,
  };

  if (process.env.MINIO_ENDPOINT) config.endpoint = process.env.MINIO_ENDPOINT;
  if (process.env.MINIO_ROOT_USER || process.env.MINIO_ROOT_PASSWORD) {
    config.credentials = {
      accessKeyId: process.env.MINIO_ROOT_USER ?? '',
      secretAccessKey: process.env.MINIO_ROOT_PASSWORD ?? '',
    };
  }

  return config;
}

function isMissingBucketError(error: unknown): boolean {
  if (!isObject(error)) {
    return false;
  }

  const errorDetails = error as {
    name?: unknown;
    $metadata?: { httpStatusCode?: unknown };
  };

  return (
    errorDetails.$metadata?.httpStatusCode === 404 ||
    (typeof errorDetails.name === 'string' &&
      MISSING_BUCKET_ERROR_NAMES.has(errorDetails.name))
  );
}

const MISSING_BUCKET_ERROR_NAMES = new Set([
  'NotFound',
  'NoSuchBucket',
  'NotFoundError',
]);

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}
