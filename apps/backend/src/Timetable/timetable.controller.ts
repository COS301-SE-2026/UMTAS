import {
  Body,
  Post,
  Get,
  Param,
  Delete,
  Controller,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { TimetableService } from './timetable.service';

@ApiTags('Timetable')
@Controller('timetable')
export class TimetableController {
  constructor(private readonly service: TimetableService) {}
} //TimetableController
