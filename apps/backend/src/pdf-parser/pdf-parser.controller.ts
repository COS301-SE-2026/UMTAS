import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
import { PdfParserService } from './pdf-parser.service';
import { PdfParserCallbackDto, SubmitPdfJobDto } from './dto/pdf-parser.dto';

@ApiTags('PDF Parser Integration')
@Controller('pdf-parser')
export class PdfParserController {
  constructor(private readonly service: PdfParserService) {}

  @Post('submit')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit a PDF file parsing job',
    description:
      'Enqueues a new PDF parsing job onto the BullMQ Redis queue for processing by the workers',
  })
  @ApiBody({ type: SubmitPdfJobDto })
  @ApiResponse({ status: 201, description: 'Job enqueued successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized session' })
  async submitJob(@Body() dto: SubmitPdfJobDto) {
    return this.service.submitJob(dto);
  }

  @Post('callback')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Callback endpoint for PDF Parser workers',
    description:
      'Bypasses standard user session guards. Called by the PDF Parser background workers to submit extracted results.',
  })
  @ApiBody({ type: PdfParserCallbackDto })
  @ApiResponse({
    status: 200,
    description: 'Callback received and processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid callback payload structure',
  })
  async handleCallback(@Body() dto: PdfParserCallbackDto) {
    return this.service.processCallback(dto);
  }
}
