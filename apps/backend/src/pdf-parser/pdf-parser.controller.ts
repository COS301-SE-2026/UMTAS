import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import type { PdfParserCallbackPayload, PdfParserResult } from 'shared-types';
import {
  PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION,
  PdfParserCallbackPayloadSchema,
} from 'shared-types';
import { Public } from '../auth/auth.guard';
import { CurrentSession, type SessionData } from '../auth/session.decorator';
import { QueueProducerService } from '../jobs/queue-producer.service';
import { WorkerCallbackAuthGuard } from '../jobs/worker-callback-auth.guard';
import { ObjectStorageService } from '../storage/object-storage.service';
import { PdfParserCallbackDto } from './dto/pdf-parser-callback.dto';
import {
  PdfParserJobResponseDto,
  PdfParserLookupResponseDto,
  PdfParserUploadResponseDto,
} from './dto/pdf-parser-job-response.dto';
import { PdfParserFingerprintService } from './pdf-parser-fingerprint.service';
import {
  PdfParserJobStoreService,
  type PdfParserJobRecord,
} from './pdf-parser-job-store.service';

@ApiTags('PDF Parser')
@Controller('pdf-parser')
export class PdfParserController {
  constructor(
    private readonly queueProducer: QueueProducerService,
    private readonly storage: ObjectStorageService,
    private readonly jobStore: PdfParserJobStoreService,
    private readonly fingerprintService: PdfParserFingerprintService,
  ) {}

  @Post('jobs/lookup')
  @ApiOperation({
    summary: 'Look up an existing PDF parser job by PDF stream fingerprint',
    description:
      'Checks for an existing parser job scoped to the authenticated user, selected university, parser adapter, and backend-supported fingerprint algorithm.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'universityId',
        'adapterKey',
        'fingerprintAlgorithm',
        'pdfStreamHash',
      ],
      properties: {
        universityId: { type: 'string', format: 'uuid' },
        adapterKey: { type: 'string', default: 'up' },
        fingerprintAlgorithm: {
          type: 'string',
          default: PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION,
        },
        pdfStreamHash: { type: 'string', minLength: 64, maxLength: 64 },
        streamCount: { type: 'number' },
      },
    },
  })
  @ApiOkResponse({ type: PdfParserLookupResponseDto })
  async lookupDuplicate(
    @CurrentSession() session: SessionData,
    @Body() body: PdfParserLookupRequestBody,
  ): Promise<PdfParserLookupResponseDto> {
    const request = validateLookupRequest(body);
    const duplicate = await this.jobStore.findDuplicate({
      userId: session.user.id,
      universityId: request.universityId,
      adapterKey: request.adapterKey,
      fingerprintAlgorithm: request.fingerprintAlgorithm,
      pdfStreamHash: request.pdfStreamHash,
      statuses: ['queued', 'completed'],
    });

    if (!duplicate) {
      return { duplicate: false };
    }

    return {
      duplicate: true,
      jobId: duplicate.jobId,
      status: duplicate.status,
      moduleGroupingId: duplicate.moduleGroupingId,
      resultAvailable: duplicate.status === 'completed' && !!duplicate.result,
      statusUrl: `/pdf-parser/jobs/${duplicate.jobId}`,
    };
  }

  @Post('jobs/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  @ApiOperation({
    summary: 'Upload a timetable PDF and enqueue it for parsing',
    description:
      'Uploads a PDF, recomputes the backend stream-payload fingerprint, persists the parse job, and enqueues it for worker parsing.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'universityId'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Timetable PDF to parse.',
        },
        adapterKey: {
          type: 'string',
          default: 'up',
          description: 'Parser adapter key. Only "up" is currently supported.',
        },
        universityId: {
          type: 'string',
          format: 'uuid',
          description: 'Selected university for duplicate scoping.',
        },
        fingerprintAlgorithm: {
          type: 'string',
          default: PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION,
          description: 'Client-computed fingerprint algorithm, if available.',
        },
        clientPdfStreamHash: {
          type: 'string',
          description: 'Client-computed PDF stream hash for diagnostics only.',
        },
        streamCount: {
          type: 'number',
          description: 'Client-observed PDF stream count for diagnostics only.',
        },
      },
    },
  })
  @ApiAcceptedResponse({ type: PdfParserUploadResponseDto })
  @HttpCode(HttpStatus.ACCEPTED)
  async uploadAndEnqueue(
    @CurrentSession() session: SessionData,
    @UploadedFile() file: UploadedPdfFile | undefined,
    @Body('adapterKey') adapterKeyInput?: string,
    @Body('universityId') universityIdInput?: string,
    @Body('fingerprintAlgorithm') fingerprintAlgorithmInput?: string,
    @Body('clientPdfStreamHash') clientPdfStreamHashInput?: string,
  ): Promise<PdfParserUploadResponseDto> {
    validateUploadedPdf(file);

    const adapterKey = normalizeAdapterKey(adapterKeyInput);
    const universityId = validateUuid(universityIdInput, 'universityId');
    const clientPdfStreamHash = normalizeOptionalHexHash(
      clientPdfStreamHashInput,
      'clientPdfStreamHash',
    );
    validateOptionalClientAlgorithm(fingerprintAlgorithmInput);
    const fingerprint = this.fingerprintService.computeOrThrow(file.buffer);

    const duplicate = await this.jobStore.findDuplicate({
      userId: session.user.id,
      universityId,
      adapterKey,
      fingerprintAlgorithm: fingerprint.algorithmVersion,
      pdfStreamHash: fingerprint.hash,
      statuses: ['queued', 'completed'],
    });

    if (duplicate) {
      return toUploadResponse(duplicate);
    }

    const jobId = `pdf-parse-${randomUUID()}`;
    const fileKey = buildFileKey(jobId, file.originalname);
    const preparedJob = await this.prepareUploadJob({
      jobId,
      userId: session.user.id,
      universityId,
      fileKey,
      adapterKey,
      clientPdfStreamHash,
      pdfStreamHash: fingerprint.hash,
      fingerprintAlgorithm: fingerprint.algorithmVersion,
      streamCount: fingerprint.streamCount,
    });

    if (preparedJob.kind === 'existing') {
      return toUploadResponse(preparedJob.record);
    }

    const record = preparedJob.record;
    const storageFileKey = record.fileKey ?? fileKey;

    try {
      await this.storage.putObject({
        key: storageFileKey,
        body: file.buffer,
        contentType: file.mimetype || 'application/pdf',
      });
    } catch (error) {
      await this.jobStore.markInfrastructureFailure(record.jobId, {
        code: 'PDF_PARSE_UPLOAD_FAILED',
        message: 'PDF parser upload could not be stored',
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      });
      throw new InternalServerErrorException(
        'PDF parser upload could not be stored',
      );
    }

    try {
      await this.queueProducer.enqueuePdfParseJob({
        jobId: record.jobId,
        fileKey: storageFileKey,
        adapterKey,
      });
    } catch (error) {
      await this.jobStore.markInfrastructureFailure(record.jobId, {
        code: 'PDF_PARSE_ENQUEUE_FAILED',
        message: 'PDF parser job could not be enqueued',
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      });
      throw new InternalServerErrorException(
        'PDF parser job could not be enqueued',
      );
    }

    return {
      jobId: record.jobId,
      fileKey: record.fileKey,
      adapterKey: record.adapterKey,
      status: record.status,
      result: record.result,
      error: record.error,
      moduleGroupingId: record.moduleGroupingId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      statusUrl: `/pdf-parser/jobs/${record.jobId}`,
    };
  }

  private async prepareUploadJob(
    input: PrepareUploadJobInput,
  ): Promise<PreparedUploadJob> {
    try {
      return {
        kind: 'pending',
        record: await this.jobStore.createQueuedJob(input),
      };
    } catch (error) {
      const duplicate = await this.jobStore.findDuplicate({
        userId: input.userId,
        universityId: input.universityId,
        adapterKey: input.adapterKey,
        fingerprintAlgorithm: input.fingerprintAlgorithm,
        pdfStreamHash: input.pdfStreamHash,
      });

      if (!duplicate) {
        throw error;
      }

      if (duplicate.status !== 'failed') {
        return { kind: 'existing', record: duplicate };
      }

      return {
        kind: 'pending',
        record: await this.jobStore.retryFailedDuplicate({
          jobId: duplicate.jobId,
          fileKey: input.fileKey,
          adapterKey: input.adapterKey,
          clientPdfStreamHash: input.clientPdfStreamHash,
          pdfStreamHash: input.pdfStreamHash,
          fingerprintAlgorithm: input.fingerprintAlgorithm,
          streamCount: input.streamCount,
        }),
      };
    }
  }

  @Get('jobs/:jobId')
  @ApiOperation({
    summary: 'Get PDF parser job status and result metadata',
    description:
      'Reads persisted parser job status scoped to the authenticated user.',
  })
  @ApiOkResponse({ type: PdfParserJobResponseDto })
  async getJob(
    @CurrentSession() session: SessionData,
    @Param('jobId') jobId: string,
  ): Promise<PdfParserJobResponseDto> {
    const job = await this.jobStore.findJob(jobId, { userId: session.user.id });
    if (!job) {
      throw new NotFoundException(`PDF parser job not found: ${jobId}`);
    }

    return job;
  }

  @Get('jobs/:jobId/result')
  @ApiOperation({
    summary: 'Get completed PDF parser result',
    description:
      'Returns persisted import candidates only for completed jobs owned by the authenticated user.',
  })
  @ApiOkResponse({ type: Object })
  async getJobResult(
    @CurrentSession() session: SessionData,
    @Param('jobId') jobId: string,
  ): Promise<PdfParserResult> {
    const job = await this.jobStore.findJob(jobId, { userId: session.user.id });
    if (!job || job.status !== 'completed' || !job.result) {
      throw new NotFoundException(`PDF parser result not found: ${jobId}`);
    }

    return job.result;
  }

  @Public()
  @Post('jobs/:jobId/callback')
  @ApiBearerAuth('bearer')
  @UseGuards(WorkerCallbackAuthGuard)
  @ApiOperation({ summary: 'Receive final PDF parser worker callback' })
  @HttpCode(HttpStatus.ACCEPTED)
  async receiveCallback(
    @Param('jobId') jobId: string,
    @Body() body: PdfParserCallbackDto,
  ): Promise<{ accepted: true; jobId: string }> {
    const callback = validatePdfParserCallback(body);
    await this.jobStore.recordCallback(jobId, callback);

    return { accepted: true, jobId };
  }
}

interface UploadedPdfFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

interface PdfParserLookupRequestBody {
  universityId?: unknown;
  adapterKey?: unknown;
  fingerprintAlgorithm?: unknown;
  pdfStreamHash?: unknown;
}

interface PrepareUploadJobInput {
  jobId: string;
  userId: string;
  universityId: string;
  fileKey: string;
  adapterKey: string;
  clientPdfStreamHash?: string;
  pdfStreamHash: string;
  fingerprintAlgorithm: string;
  streamCount: number;
}

type PreparedUploadJob =
  | { kind: 'pending'; record: PdfParserJobRecord }
  | { kind: 'existing'; record: PdfParserJobRecord };

function validateUploadedPdf(
  file: UploadedPdfFile | undefined,
): asserts file is UploadedPdfFile {
  if (!file) {
    throw new BadRequestException('PDF file is required');
  }

  if (!file.buffer || file.size <= 0) {
    throw new BadRequestException('PDF file is empty');
  }

  const hasPdfMimeType = file.mimetype === 'application/pdf';
  const hasPdfFileName = /\.pdf$/i.test(file.originalname);
  if (!hasPdfMimeType && !hasPdfFileName) {
    throw new BadRequestException('Uploaded file must be a PDF');
  }
}

function toUploadResponse(
  record: PdfParserJobRecord,
): PdfParserUploadResponseDto {
  return {
    jobId: record.jobId,
    fileKey: record.fileKey,
    adapterKey: record.adapterKey,
    status: record.status,
    result: record.result,
    error: record.error,
    moduleGroupingId: record.moduleGroupingId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    statusUrl: `/pdf-parser/jobs/${record.jobId}`,
  };
}

function normalizeAdapterKey(adapterKeyInput: string | undefined): string {
  const adapterKey = adapterKeyInput?.trim() || 'up';
  if (adapterKey !== 'up') {
    throw new BadRequestException('Only the "up" PDF adapter is supported');
  }

  return adapterKey;
}

function validateLookupRequest(body: PdfParserLookupRequestBody): {
  universityId: string;
  adapterKey: string;
  fingerprintAlgorithm: string;
  pdfStreamHash: string;
} {
  const adapterKey =
    typeof body.adapterKey === 'string'
      ? normalizeAdapterKey(body.adapterKey)
      : normalizeAdapterKey(undefined);
  const universityId = validateUuid(body.universityId, 'universityId');
  const fingerprintAlgorithm = validateFingerprintAlgorithm(
    body.fingerprintAlgorithm,
  );
  const pdfStreamHash = normalizeRequiredHexHash(
    body.pdfStreamHash,
    'pdfStreamHash',
  );

  return {
    universityId,
    adapterKey,
    fingerprintAlgorithm,
    pdfStreamHash,
  };
}

function validateFingerprintAlgorithm(value: unknown): string {
  if (value !== PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION) {
    throw new BadRequestException(
      `Unsupported fingerprint algorithm: ${String(value)}`,
    );
  }

  return value;
}

function validateOptionalClientAlgorithm(value: unknown): void {
  if (value === undefined || value === null || value === '') {
    return;
  }

  validateFingerprintAlgorithm(value);
}

function validateUuid(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value.trim())) {
    throw new BadRequestException(`${fieldName} must be a UUID`);
  }

  return value.trim();
}

function normalizeRequiredHexHash(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !HEX_SHA_256_PATTERN.test(value.trim())) {
    throw new BadRequestException(
      `${fieldName} must be a 64-character hex hash`,
    );
  }

  return value.trim().toLowerCase();
}

function normalizeOptionalHexHash(
  value: unknown,
  fieldName: string,
): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return normalizeRequiredHexHash(value, fieldName);
}

function buildFileKey(jobId: string, originalName: string): string {
  const safeName = originalName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `uploads/pdf-parser/${jobId}/${safeName || 'input.pdf'}`;
}

function validatePdfParserCallback(
  body: PdfParserCallbackDto,
): PdfParserCallbackPayload {
  const result = PdfParserCallbackPayloadSchema.safeParse(body);
  if (result.success) {
    return result.data;
  }

  throw new BadRequestException({
    message: 'PDF parser callback did not match the shared parser contract',
    issues: result.error.issues,
  });
}

const HEX_SHA_256_PATTERN = /^[0-9a-f]{64}$/i;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
