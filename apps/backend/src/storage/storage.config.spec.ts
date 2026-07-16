import {
  buildObjectStorageConfig,
  buildS3ClientConfig,
} from './storage.config';

describe('buildObjectStorageConfig', () => {
  it('reads backend MinIO settings', () => {
    const config = buildObjectStorageConfig((key) => {
      const env: Record<string, string> = {
        MINIO_BUCKET: 'backend-uploads',
        MINIO_ENDPOINT: 'http://minio:9000',
        MINIO_ROOT_USER: 'backend-access',
        MINIO_ROOT_PASSWORD: 'backend-secret',
      };

      return env[key];
    });

    expect(config).toEqual({
      bucket: 'backend-uploads',
      endpoint: 'http://minio:9000',
      accessKeyId: 'backend-access',
      secretAccessKey: 'backend-secret',
      createBucketOnStartup: true,
    });
  });

  it('can use MinIO root credentials for local backend setup', () => {
    const config = buildObjectStorageConfig((key) => {
      const env: Record<string, string> = {
        MINIO_BUCKET: 'umtas-uploads',
        MINIO_ROOT_USER: 'storage-admin',
        MINIO_ROOT_PASSWORD: 'storage-secret',
      };

      return env[key];
    });

    expect(config.accessKeyId).toBe('storage-admin');
    expect(config.secretAccessKey).toBe('storage-secret');
  });
});

describe('buildS3ClientConfig', () => {
  it('builds an S3-compatible client config from storage config', () => {
    const clientConfig = buildS3ClientConfig({
      bucket: 'umtas-uploads',
      endpoint: 'http://localhost:9000',
      accessKeyId: 'minio',
      secretAccessKey: 'miniosecret',
      createBucketOnStartup: true,
    });

    expect(clientConfig).toEqual({
      region: 'us-east-1',
      endpoint: 'http://localhost:9000',
      forcePathStyle: true,
      credentials: {
        accessKeyId: 'minio',
        secretAccessKey: 'miniosecret',
      },
    });
  });
});
