import { ModuleService } from './module.service';
import {
  CreateModuleDto,
  DeleteModuleResponseDto,
  ModuleListResponseDto,
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
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';

@ApiTags('Modules')
@Controller('modules')
export class ModuleController {
  constructor(private readonly service: ModuleService) {}

  //Create
  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a module' })
  @ApiCreatedResponse({
    description: 'Module created successfully',
    type: SingleModuleResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Missing or invalid module payload' })
  @ApiConflictResponse({ description: 'Module code already exists' })
  createModule(@Body() dto: CreateModuleDto) {
    return this.service.create(dto);
  }

  //Get all
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get modules' })
  @ApiOkResponse({
    description: 'Modules returned successfully',
    type: ModuleListResponseDto,
  })
  getAll() {
    return this.service.getAll();
  }

  //Get by id
  @Public()
  @Get(':moduleId')
  @ApiOperation({ summary: 'Get a module by ID' })
  @ApiOkResponse({
    description: 'Module returned successfully',
    type: SingleModuleResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid module ID' })
  @ApiNotFoundResponse({ description: 'Module not found' })
  getById(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.service.getById(moduleId);
  }

  //Update
  @Public()
  @Patch(':moduleId')
  @ApiOperation({ summary: 'Update a module' })
  @ApiOkResponse({
    description: 'Module returned successfully',
    type: SingleModuleResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid update payload or module ID' })
  @ApiConflictResponse({ description: 'Duplicate module code detected' })
  @ApiNotFoundResponse({ description: 'Module not found' })
  update(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.service.update(moduleId, dto);
  }

  @Public()
  @Delete(':moduleId')
  @ApiOperation({ summary: 'Delete module by id' })
  @ApiOkResponse({
    description: 'Module deleted successfully',
    type: DeleteModuleResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid module ID' })
  @ApiNotFoundResponse({ description: 'Module not found' })
  delete(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.service.deleteById(moduleId);
  }
} //ModuleController
