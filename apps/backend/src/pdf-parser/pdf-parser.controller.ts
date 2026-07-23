import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import type { PdfParserCallbackPayload, PdfParserResult } from 'shared-types';
import {
  PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION,
  PdfParserCallbackPayloadSchema,
} from 'shared-types';
import { Public } from '../auth/auth.guard';
import { CurrentSession, type SessionData } from '../auth/session.decorator';
import { WorkerCallbackAuthGuard } from '../jobs/worker-callback-auth.guard';
import {
  AcceptedJobResponseDto,
  PdfParserResultDto,
} from '../jobs/dto/worker-contract.dto';
import { PdfParserCallbackDto } from './dto/pdf-parser-callback.dto';
import {
  PdfParserJobResponseDto,
  PdfParserLookupResponseDto,
  PdfParserUploadResponseDto,
} from './dto/pdf-parser-job-response.dto';
import { PdfParseSubmission } from './pdf-parse-submission';
import { PdfParserJobStoreService } from './pdf-parser-job-store.service';

@ApiTags('PDF Parser')
@Controller('pdf-parser')
export class PdfParserController {
  constructor(
    private readonly jobStore: PdfParserJobStoreService,
    private readonly submission: PdfParseSubmission,
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

    return this.submission.submit({
      userId: session.user.id,
      universityId,
      adapterKey,
      clientPdfStreamHash,
      file: {
        originalName: file.originalname,
        mimetype: file.mimetype,
        buffer: file.buffer,
      },
    });
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
  @ApiOkResponse({ type: PdfParserResultDto })
  async getJobResult(
    @CurrentSession() session: SessionData,
    @Param('jobId') jobId: string,
  ): Promise<PdfParserResult> {
    const job = await this.jobStore.findJob(jobId, { userId: session.user.id });
    if (job?.status !== 'completed' || !job.result) {
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
  @ApiAcceptedResponse({ type: AcceptedJobResponseDto })
  async receiveCallback(
    @Param('jobId') jobId: string,
    @Body() body: PdfParserCallbackDto,
  ): Promise<AcceptedJobResponseDto> {
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

function validateUploadedPdf(
  file: UploadedPdfFile | undefined,
): asserts file is UploadedPdfFile {
  if (!file) {
    throw new BadRequestException('PDF file is required');
  }

  if (!file.buffer || file.size <= 0) {
    throw new BadRequestException('PDF file is empty');
  }

  if (!hasPdfMagicBytes(file.buffer)) {
    throw new BadRequestException('Uploaded file must be a PDF');
  }

  const hasPdfMimeType = file.mimetype === 'application/pdf';
  const hasPdfFileName = /\.pdf$/i.test(file.originalname);
  if (!hasPdfMimeType && !hasPdfFileName) {
    throw new BadRequestException('Uploaded file must be a PDF');
  }
}

function hasPdfMagicBytes(buffer: Buffer): boolean {
  return (
    buffer.length >= 5 &&
    buffer[0] === 37 &&
    buffer[1] === 80 &&
    buffer[2] === 68 &&
    buffer[3] === 70 &&
    buffer[4] === 45
  );
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

function validatePdfParserCallback(
  body: PdfParserCallbackDto,
): PdfParserCallbackPayload {
  const candidate = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );
  const result = PdfParserCallbackPayloadSchema.safeParse(candidate);
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
