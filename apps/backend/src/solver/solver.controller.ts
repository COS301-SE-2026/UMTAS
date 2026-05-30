import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
import { SolverService } from './solver.service';
import { SolverCallbackDto, SubmitSolverJobDto } from './dto/solver.dto';

@ApiTags('Solver Integration')
@Controller('solver')
export class SolverController {
  constructor(private readonly service: SolverService) {}

  @Post('submit')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit a timetable optimization job',
    description:
      'Enqueues a new constraint solving job onto the BullMQ Redis queue for processing by the solver worker',
  })
  @ApiBody({ type: SubmitSolverJobDto })
  @ApiResponse({ status: 201, description: 'Job enqueued successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized session' })
  async submitJob(@Body() dto: SubmitSolverJobDto) {
    return this.service.submitJob(dto);
  }

  @Post('callback')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Callback endpoint for Solver workers',
    description:
      'Bypasses standard user session guards. Called by the Solver background workers to submit computed timetables.',
  })
  @ApiBody({ type: SolverCallbackDto })
  @ApiResponse({
    status: 200,
    description: 'Callback received and processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid callback payload structure',
  })
  async handleCallback(@Body() dto: SolverCallbackDto) {
    return this.service.processCallback(dto);
  }
}
