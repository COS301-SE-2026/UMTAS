import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildObjectStorageConfig,
  buildS3ClientConfig,
  type ObjectStorageConfig,
} from './storage.config';

export interface ObjectStorageClient {
  send(
    command: HeadBucketCommand | CreateBucketCommand | PutObjectCommand,
  ): Promise<unknown>;
}

export const OBJECT_STORAGE_CLIENT = Symbol('OBJECT_STORAGE_CLIENT');

@Injectable()
export class ObjectStorageService implements OnModuleInit {
  private readonly logger = new Logger(ObjectStorageService.name);
  private readonly config: ObjectStorageConfig;
  private readonly client: ObjectStorageClient;

  constructor(
    configService: ConfigService,
    @Optional()
    @Inject(OBJECT_STORAGE_CLIENT)
    client?: ObjectStorageClient,
  ) {
    this.config = buildObjectStorageConfig((key) =>
      configService.get<string>(key),
    );
    this.client = client ?? new S3Client(buildS3ClientConfig(this.config));
  }

  async onModuleInit(): Promise<void> {
    if (!this.config.bucket) {
      this.logger.warn(
        'Object storage bucket is not configured; skipping setup',
      );
      return;
    }

    if (!this.config.createBucketOnStartup) {
      this.logger.log('Object storage bucket creation is disabled');
      return;
    }

    await this.ensureBucketExists();
  }

  async ensureBucketExists(): Promise<void> {
    try {
      await this.client.send(
        new HeadBucketCommand({ Bucket: this.config.bucket }),
      );
      this.logger.log(`Object storage bucket is ready: ${this.config.bucket}`);
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
    if (!this.config.bucket) {
      throw new Error('Object storage bucket is not configured');
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: options.key,
        Body: options.body,
        ContentLength: options.body.byteLength,
        ContentType: options.contentType,
      }),
    );

    return { bucket: this.config.bucket, key: options.key };
  }

  private async createBucket(): Promise<void> {
    await this.client.send(
      new CreateBucketCommand({ Bucket: this.config.bucket }),
    );
    this.logger.log(`Created object storage bucket: ${this.config.bucket}`);
  }
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
