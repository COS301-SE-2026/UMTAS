import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotImplementedException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
import { WorkerCallbackAuthGuard } from '../jobs/worker-callback-auth.guard';
import { SolverCallbackDto } from './dto/solver-callback.dto';

@Public()
@ApiTags('Solver')
@ApiBearerAuth('bearer')
@UseGuards(WorkerCallbackAuthGuard)
@Controller('solver')
export class SolverController {
  @Get('jobs/:jobId/input')
  getInput(@Param('jobId') _jobId: string) {
    // TODO: return backend-prepared solver input JSON once the solver input
    // builder is implemented.
    throw new NotImplementedException(
      'Solver input builder is not implemented',
    );
  }

  @Post('jobs/:jobId/callback')
  @HttpCode(HttpStatus.ACCEPTED)
  receiveCallback(
    @Param('jobId') jobId: string,
    @Body() _body: SolverCallbackDto,
  ) {
    // TODO: persist solver status/result after the solver CLI contract settles.
    return { accepted: true, jobId };
  }
}
