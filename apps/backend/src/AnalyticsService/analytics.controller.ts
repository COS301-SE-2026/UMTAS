import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from 'src/auth/roles.guard';
import { CourseModuleStatsResponseDto } from './dto/analytics.dto';

@ApiTags('Analytics')
@Controller('Analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  //Modules per Course
  @Get('course/:courseID')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Count of modules per specified course',
    operationId: 'coursesPerSpecificCourse',
  })
  @ApiResponse({
    status: 200,
    description: 'Count of courses for user`s university returned',
    type: CourseModuleStatsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  modulesPerSpecificCourse(
    @Param('courseID', ParseUUIDPipe) courseId: string,
  ): Promise<CourseModuleStatsResponseDto> {
    return this.service.modulesPerSpecificCourse(courseId);
  }

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
