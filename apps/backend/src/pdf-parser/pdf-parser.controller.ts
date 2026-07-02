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
import { randomUUID } from 'node:crypto';
import type { PdfParserCallbackPayload } from 'shared-types';
import { PdfParserCallbackPayloadSchema } from 'shared-types';
import { Public } from '../auth/auth.guard';
import { QueueProducerService } from '../jobs/queue-producer.service';
import { WorkerCallbackAuthGuard } from '../jobs/worker-callback-auth.guard';
import { ObjectStorageService } from '../storage/object-storage.service';
import { PdfParserCallbackDto } from './dto/pdf-parser-callback.dto';
import {
  PdfParserJobResponseDto,
  PdfParserUploadResponseDto,
} from './dto/pdf-parser-job-response.dto';
import { PdfParserJobStoreService } from './pdf-parser-job-store.service';

@ApiTags('PDF Parser')
@Controller('pdf-parser')
export class PdfParserController {
  constructor(
    private readonly queueProducer: QueueProducerService,
    private readonly storage: ObjectStorageService,
    private readonly jobStore: PdfParserJobStoreService,
  ) {}

  @Public()
  @Post('jobs/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  @ApiOperation({
    summary: 'Upload a timetable PDF and enqueue it for parsing',
    description:
      'Temporary backend-only test endpoint. Results are stored in memory until database persistence is implemented.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
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
      },
    },
  })
  @ApiAcceptedResponse({ type: PdfParserUploadResponseDto })
  @HttpCode(HttpStatus.ACCEPTED)
  async uploadAndEnqueue(
    @UploadedFile() file: UploadedPdfFile | undefined,
    @Body('adapterKey') adapterKeyInput?: string,
  ): Promise<PdfParserUploadResponseDto> {
    validateUploadedPdf(file);

    const adapterKey = normalizeAdapterKey(adapterKeyInput);
    const jobId = `pdf-parse-${randomUUID()}`;
    const fileKey = buildFileKey(jobId, file.originalname);

    await this.storage.putObject({
      key: fileKey,
      body: file.buffer,
      contentType: file.mimetype || 'application/pdf',
    });

    const record = this.jobStore.createQueuedJob({
      jobId,
      fileKey,
      adapterKey,
    });

    await this.queueProducer.enqueuePdfParseJob({
      jobId,
      fileKey,
      adapterKey,
    });

    return {
      ...record,
      statusUrl: `/pdf-parser/jobs/${jobId}`,
    };
  }

  @Public()
  @Get('jobs/:jobId')
  @ApiOperation({
    summary: 'Get temporary PDF parser job status and result',
    description:
      'Temporary in-memory status endpoint for local Swagger testing. Data is lost when the backend restarts.',
  })
  @ApiOkResponse({ type: PdfParserJobResponseDto })
  getJob(@Param('jobId') jobId: string): PdfParserJobResponseDto {
    const job = this.jobStore.findJob(jobId);
    if (!job) {
      throw new NotFoundException(`PDF parser job not found: ${jobId}`);
    }

    return job;
  }

  @Public()
  @Post('jobs/:jobId/callback')
  @ApiBearerAuth('bearer')
  @UseGuards(WorkerCallbackAuthGuard)
  @ApiOperation({ summary: 'Receive final PDF parser worker callback' })
  @HttpCode(HttpStatus.ACCEPTED)
  receiveCallback(
    @Param('jobId') jobId: string,
    @Body() body: PdfParserCallbackDto,
  ) {
    const callback = validatePdfParserCallback(body);
    this.jobStore.recordCallback(jobId, callback);

    // TODO: Persist parser job status and surface import candidates to the UI.
    return { accepted: true, jobId };
  }
}

interface UploadedPdfFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
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

  const hasPdfMimeType = file.mimetype === 'application/pdf';
  const hasPdfFileName = /\.pdf$/i.test(file.originalname);
  if (!hasPdfMimeType && !hasPdfFileName) {
    throw new BadRequestException('Uploaded file must be a PDF');
  }
}

function normalizeAdapterKey(adapterKeyInput: string | undefined): string {
  const adapterKey = adapterKeyInput?.trim() || 'up';
  if (adapterKey !== 'up') {
    throw new BadRequestException('Only the "up" PDF adapter is supported');
  }

  return adapterKey;
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
