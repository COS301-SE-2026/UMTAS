import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from 'src/auth/roles.guard';
import { UniversityCourseStatsResponseDto } from './analytics.dto';

@ApiTags('Analytics')
@Controller('Analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  //Courses per University
  @Get('university/:universityId')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Count of Courses per University / all universities',
  })
  @ApiResponse({
    status: 200,
    description: 'Courses per university counts returned',
    type: UniversityCourseStatsResponseDto,
  })
  coursesPerUniversity(
    @Param('universityId', ParseUUIDPipe) uniId: string,
  ): Promise<UniversityCourseStatsResponseDto> {
    return this.service.coursesPerUniversity(uniId);
  } //END_coursesPerUniversity

  //Modules per Course

  //Events per Module

  //Events per Venue

  // //Get all universities
  // @Get('university')
  // @Roles('uni_admin')
  // @ApiOperation({
  //     summary: 'Analytics for all universities'
  // })
  // @ApiResponse({
  //     status: 200,
  //     description: 'Universities stats returned',
  //     type: UniversitySingleResponseDto
  // })
  // getAllUniversityStats(
  //     @CurrentSession() session: SessionData
  // ): Promise<UniversityStatsListResponseDto> {

  //     return this.service.allUniversityStats(session.user.id)
  // }//END_getAllUniversityStats

  // @Get('university/:uniId')
  // @Roles('lecturer', 'uni_admin')
  // @ApiOperation({
  //     summary: 'Analytics for a specific university'
  // })
  // @ApiParam({
  //     name: 'uniId',
  //     description: 'University UUID',
  //     type: String
  // })
  // @ApiResponse({
  //     status: 200,
  //     description: 'University specific stats returned',
  //     type: UniversitySingleResponseDto
  // })
  // getSpecificUniversityStats(
  //     @CurrentSession() session: SessionData,
  //     @Param('attendanceId', ParseUUIDPipe) uniId: string
  // ): Promise<UniversityStatsSingleResponseDto> {

  //     return this.service.universitySpecificStats(session.user.id, uniId);
  // }//END_getSpecificuniversityStats
} //END_AnaylticsController
