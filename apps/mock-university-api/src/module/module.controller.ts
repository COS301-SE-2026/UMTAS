import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Modules')
@Controller('api/modules')
export class ModuleController {
  @Get()
  @ApiOperation({ summary: 'Get all modules' })
  getModules() {
    return [
      {
        module_id: 'COS301-M1',
        course_id: 'COS301',
        module_name: 'Requirements Engineering',
        week: 1,
      },
      {
        module_id: 'COS301-M2',
        course_id: 'COS301',
        module_name: 'Software Architecture',
        week: 2,
      },
    ];
  }
}
