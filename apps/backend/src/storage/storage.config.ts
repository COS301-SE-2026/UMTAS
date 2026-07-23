import type { S3ClientConfig } from '@aws-sdk/client-s3';
import { z } from 'zod';

export type EnvReader = (key: string) => string | undefined;

export interface ObjectStorageConfig {
  bucket: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  createBucketOnStartup: boolean;
}

const MINIO_SIGNING_REGION = 'us-east-1';
const truthyStringSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.enum(['1', 'true', 'yes', 'on']));

export function buildObjectStorageConfig(
  readEnv: EnvReader,
): ObjectStorageConfig {
  const config: ObjectStorageConfig = {
    bucket: readEnv('MINIO_BUCKET') ?? '',
    createBucketOnStartup: readBoolean(
      readEnv('MINIO_CREATE_BUCKET_ON_STARTUP'),
      true,
    ),
  };

  const endpoint = readEnv('MINIO_ENDPOINT');
  if (endpoint) {
    config.endpoint = endpoint;
  }

  const accessKeyId = readEnv('MINIO_ROOT_USER');
  if (accessKeyId) {
    config.accessKeyId = accessKeyId;
  }

  const secretAccessKey = readEnv('MINIO_ROOT_PASSWORD');
  if (secretAccessKey) {
    config.secretAccessKey = secretAccessKey;
  }

  return config;
}

export function buildS3ClientConfig(
  config: ObjectStorageConfig,
): S3ClientConfig {
  const clientConfig: S3ClientConfig = {
    region: MINIO_SIGNING_REGION,
    forcePathStyle: true,
  };

  if (config.endpoint) {
    clientConfig.endpoint = config.endpoint;
  }

  if (config.accessKeyId || config.secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId: config.accessKeyId ?? '',
      secretAccessKey: config.secretAccessKey ?? '',
    };
  }

  return clientConfig;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  return truthyStringSchema.safeParse(value).success;
}
