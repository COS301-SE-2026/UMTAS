import { ModuleService } from './module.service';
import { CreateModuleDto, UpdateModuleDto } from './dto/module.dto';
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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
@Controller('modules')
export class ModuleController {
  constructor(private readonly service: ModuleService) {}

  //Create
  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a module' })
  @ApiCreatedResponse({ description: 'Module created succesfully' })
  createModule(@Body() dto: CreateModuleDto) {
    return this.service.create(dto);
  }

  //Get all
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get modules' })
  @ApiOkResponse({ description: 'Modules returned successfully' })
  getAll() {
    return this.service.getAll();
  }

  //Get by id
  @Public()
  @Get(':moduleId')
  @ApiOperation({ summary: 'Get certain module' })
  @ApiOkResponse({ description: 'Module returned successfully' })
  getById(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.service.getById(moduleId);
  }

  //Update
  @Public()
  @Patch(':moduleId')
  @ApiOperation({ summary: 'Get one module' })
  @ApiOkResponse({ description: 'Module returned successfully' })
  update(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.service.update(moduleId, dto);
  }

  @Public()
  @Delete(':moduleId')
  @ApiOperation({ summary: 'Delete module by id' })
  @ApiOkResponse({ description: 'Module deleted successfully' })
  delete(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.service.deleteById(moduleId);
  }
} //EventController
