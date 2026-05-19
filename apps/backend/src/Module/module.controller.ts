import { ModuleService } from './module.service';
import {
  CreateModuleDto,
  DeleteModuleResponseDto,
  SingleModuleResponseDto,
  UpdateModuleDto,
} from './dto/module.dto';
import {
  Post,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';

@ApiTags('Modules')
@Controller('modules')
export class ModuleController {
  constructor(private readonly service: ModuleService) {}

  //Create
  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a module' })
  @ApiBody({ type: CreateModuleDto })
  @ApiResponse({
    status: 201,
    description: 'Module created successfully',
    type: SingleModuleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid module payload',
  })
  @ApiResponse({
    status: 409,
    description: 'Module code already exists',
  })
  createModule(@Body() dto: CreateModuleDto) {
    return this.service.create(dto);
  }

  //Get all
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get a module by ID',
    operationId: 'getModuleById',
  })
  @ApiResponse({
    status: 200,
    description: 'Module returned successfully',
    type: SingleModuleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid module ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found',
  })
  getAll() {
    return this.service.getAll();
  }

  //Get by id
  @Public()
  @Get(':moduleId')
  @ApiOperation({
    summary: 'Get a module by ID',
    operationId: 'getModuleById',
  })
  @ApiResponse({
    status: 200,
    description: 'Module returned successfully',
    type: SingleModuleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid module ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found',
  })
  getById(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.service.getById(moduleId);
  }

  //Update
  @Public()
  @Patch(':moduleId')
  @ApiOperation({
    summary: 'Update a module',
    operationId: 'updateModule',
  })
  @ApiBody({ type: UpdateModuleDto })
  @ApiResponse({
    status: 200,
    description: 'Module updated successfully',
    type: SingleModuleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update payload or module ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Duplicate module code detected',
  })
  update(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.service.update(moduleId, dto);
  }

  @Public()
  @Delete(':moduleId')
  @ApiOperation({
    summary: 'Delete a module by ID',
    operationId: 'deleteModule',
  })
  @ApiResponse({
    status: 200,
    description: 'Module deleted successfully',
    type: DeleteModuleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid module ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found',
  })
  delete(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.service.deleteById(moduleId);
  }
} //ModuleController
