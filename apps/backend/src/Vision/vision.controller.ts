import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentSession, type SessionData } from 'src/auth/session.decorator';
import { Roles } from 'src/auth/roles.guard';

import { VisionService } from './vision.service';
import {
  CreateVisionSessionDto,
  CreateVisionSessionInput,
  DeleteVisionSessionResponseDto,
  UpdateVisionSessionDto,
  VisionSessionListResponseDto,
  VisionSessionQueryDto,
  VisionSessionSingleResponseDto,
} from './dto';

@ApiTags('Vision Sessions')
@Controller('vision-sessions')
export class VisionController {
  constructor(private readonly service: VisionService) {}

  //Create
  @Post()
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Create a vision session',
    operationId: 'createVisionSession',
  })
  @ApiBody({ type: CreateVisionSessionDto })
  @ApiCreatedResponse({
    description: 'Vision session created successfully',
    type: VisionSessionSingleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid vision session payload or session date',
  })
  @ApiConflictResponse({
    description:
      'A vision session with the same name already exists for the module on the specified date',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  create(
    @CurrentSession() session: SessionData,
    @Body() dto: CreateVisionSessionDto,
  ): Promise<VisionSessionSingleResponseDto> {
    const input: CreateVisionSessionInput = {
      ...dto,
      CreatedBy: session.user.id,
    };

    return this.service.create(input);
  } //END_create

  //get all
  @Get()
  @Roles('student', 'lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Get vision sessions',
    description:
      'Returns vision sessions matching the supplied module, event, date, and name filters.',
    operationId: 'getAllVisionSessions',
  })
  @ApiOkResponse({
    description: 'Vision sessions returned successfully',
    type: VisionSessionListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'One or more query filters are invalid',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  getAll(
    @Query() query: VisionSessionQueryDto,
  ): Promise<VisionSessionListResponseDto> {
    return this.service.getAll(query);
  } //END_getAll

  //Get by ID
  @Get(':sessionId')
  @Roles('student', 'lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Get a vision session by ID',
    operationId: 'getVisionSessionById',
  })
  @ApiOkResponse({
    description: 'Vision session returned successfully',
    type: VisionSessionSingleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid vision session ID',
  })
  @ApiNotFoundResponse({
    description: 'Vision session not found',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  getById(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<VisionSessionSingleResponseDto> {
    return this.service.getById(sessionId);
  } //END_getById

  // Update
  @Patch(':sessionId')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Update a vision session',
    description:
      'Updates the supplied session fields. Session ID, module, creator, and creation timestamp cannot be changed.',
    operationId: 'updateVisionSession',
  })
  @ApiBody({ type: UpdateVisionSessionDto })
  @ApiOkResponse({
    description: 'Vision session updated successfully',
    type: VisionSessionSingleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid vision session ID, payload, or session date',
  })
  @ApiConflictResponse({
    description:
      'A vision session with the same name already exists for the module on the specified date',
  })
  @ApiNotFoundResponse({
    description: 'Vision session or linked event not found',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  update(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: UpdateVisionSessionDto,
  ): Promise<VisionSessionSingleResponseDto> {
    return this.service.update(sessionId, dto);
  } //END_udpate

  //Delete
  @Delete(':sessionId')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Delete a vision session',
    operationId: 'deleteVisionSession',
  })
  @ApiOkResponse({
    description: 'Vision session deleted successfully',
    type: DeleteVisionSessionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid vision session ID',
  })
  @ApiNotFoundResponse({
    description: 'Vision session not found',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  delete(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<DeleteVisionSessionResponseDto> {
    return this.service.delete(sessionId);
  } //END_delete
} //END_VisionController
