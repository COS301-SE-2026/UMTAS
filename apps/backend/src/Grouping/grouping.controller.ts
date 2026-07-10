import { GroupingService } from './grouping.service';
import {
  GroupingSingleResponse,
  PopulateGroupBodyDto,
} from './dto/grouping.dto';

import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '../auth/roles.guard';

@ApiTags('Grouping')
@Controller('grouping')
export class GroupingController {
  constructor(private readonly service: GroupingService) {}

  //Populate group with modules
  @Patch(':groupId')
  @Roles('uni_admin', 'lecturer')
  @ApiOperation({
    summary: 'Add array of modules to a module group',
    description: `Add array of modules to a ModuleGrouping.' 
        If added modules causes group to be the same hash as an 
        already existing group, then it will return the group that 
        matches and not update the current group. If no other group 
        with same hash exists then it will update group and populate.`.trim(),
    operationId: 'populateGroup',
  })
  @ApiBody({ type: PopulateGroupBodyDto })
  @ApiResponse({
    status: 201,
    description: 'ModuleGrouping successfully populated with modules',
    type: GroupingSingleResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  populateGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: PopulateGroupBodyDto,
  ): Promise<GroupingSingleResponse> {
    return this.service.populateGroup(groupId, dto.modules);
  } //END_populateGroup
} //END_GroupingController
