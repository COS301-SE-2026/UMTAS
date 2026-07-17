import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import {
  GetObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { WorkerExecutionError } from "bullmq-worker-core";
import type { PdfStorageClient } from "./contracts.js";

export interface S3StorageClientOptions {
  bucket: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  client?: S3Client;
}

export class S3PdfStorageClient implements PdfStorageClient {
  private readonly bucket: string;
  private readonly client: S3Client;

  constructor(options: S3StorageClientOptions) {
    this.bucket = options.bucket;
    this.client = options.client ?? new S3Client(buildS3ClientConfig(options));
  }

  async downloadFile(
    fileKey: string,
    destinationPath: string,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: fileKey }),
      abortSignal ? { abortSignal } : undefined,
    );

    if (!response.Body) {
      throw new WorkerExecutionError(
        "PDF_DOWNLOAD_FAILED",
        "S3 object body was empty.",
        {
          fileKey,
          bucket: this.bucket,
        },
      );
    }

    await pipeline(
      toReadable(response.Body),
      createWriteStream(destinationPath),
      {
        signal: abortSignal,
      },
    );
  }
}

function buildS3ClientConfig(options: S3StorageClientOptions): S3ClientConfig {
  const config: S3ClientConfig = {
    region: "us-east-1",
    forcePathStyle: true,
  };

  if (options.endpoint) {
    config.endpoint = options.endpoint;
  }

  if (options.accessKeyId || options.secretAccessKey) {
    config.credentials = {
      accessKeyId: options.accessKeyId ?? "",
      secretAccessKey: options.secretAccessKey ?? "",
    };
  }

  return config;
}

function toReadable(body: unknown): NodeJS.ReadableStream {
  if (body instanceof Readable) {
    return body;
  }

  if (isAsyncIterable(body)) {
    return Readable.from(body);
  }

  if (isWebReadableStream(body)) {
    return Readable.fromWeb(body);
  }

  throw new WorkerExecutionError(
    "PDF_DOWNLOAD_FAILED",
    "S3 object body stream type was unsupported.",
  );
}

function isAsyncIterable(value: unknown): value is AsyncIterable<Uint8Array> {
  return (
    typeof value === "object" && value !== null && Symbol.asyncIterator in value
  );
}

function isWebReadableStream(
  value: unknown,
): value is ReadableStream<Uint8Array> {
  return (
    typeof ReadableStream !== "undefined" && value instanceof ReadableStream
  );
}
