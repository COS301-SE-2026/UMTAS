import { ModuleService } from './module.service';
import { CreateModuleDto, UpdateModuleDto } from './dto/module.dto';
import {
  Post,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseFileOptions,
  Delete,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@Controller('modules')
export class ModuleController {
  constructor(private readonly service: ModuleService) {}

  //Create
  @Post()
  @ApiOperation({ summary: 'Create a module' })
  @ApiCreatedResponse({ description: 'Module create succesfully' })
  createModule(@Body() dto: CreateModuleDto) {
    return this.service.create(dto);
  }

  //Get all
  @Get()
  @ApiOperation({ summary: 'Get moduels' })
  @ApiOkResponse({ description: 'Modules returned successfully' })
  getAll() {
    return this.service.getAll();
  }

  //Get by id
  @Get()
  @ApiOperation({ summary: 'Get certain module' })
  @ApiOkResponse({ description: 'Module returned successfully' })
  getById(@Param('moduleId') moduleId: string) {
    return this.service.getById(moduleId);
  }

  //Update
  @Patch('moduleId')
  @ApiOperation({ summary: 'Get one module' })
  @ApiOkResponse({ description: 'Module returned successfully' })
  update(@Param('moduleId') moduleId: string, @Body() dto: UpdateModuleDto) {
    return this.service.update(moduleId, dto);
  }
} //EventController
