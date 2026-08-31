import { Injectable } from '@nestjs/common';
import { UniversityCourseStatsResponseDto } from './analytics.dto';
import { AnalyticsRepository } from './analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository) {}

  // Courses per University
  async coursesPerUniversity(
    uniId: string,
  ): Promise<UniversityCourseStatsResponseDto> {
    const result = await this.repo.getCoursesPerUniversity(uniId);

    return {
      data: [
        {
          UniversityID: result.UniversityID,
          UniversityName: result.UniversityName,
          CourseCount: result.CourseCount,
        },
      ],
    };
  } //END_coursesPerUniversity

  // //Universities
  // async allUniversityStats(userId: string, tx?: AppDatabase): Promise<UniversityStatsListResponseDto> {
  //     if (!tx) {
  //         return await this.dbService.db.transaction(async (t: AppDatabase) => {
  //             return this.allUniversityStats(userId, t);
  //         });
  //     } //END_tx precence check

  //     //Fetch all universities
  //     const universities = (await this.uniService.getAll(userId, tx)).universities;

  //     //Fetch stats for each university
  //     let responseUnis: UniversityStatsSingleResponseDto[] = await Promise.all(

  //         universities.map(async (uni)=>{

  //             const stats = await this.universitySpecificStats(userId, uni, tx);
  //             return stats;
  //         })
  //     );//END_resposneUni

  //     return {
  //         Universities: responseUnis,
  //         message: `Stats returned for [${responseUnis.length}] Universities.`
  //     };
  // }//END_universityStats

  // async universitySpecificStats(
  //     userId: string,
  //     uniIdOrObject: string | UniversityDto,
  //     tx?: AppDatabase
  // ): Promise<UniversityStatsSingleResponseDto> {
  //     if (!tx) {
  //         return await this.dbService.db.transaction(async (t: AppDatabase) => {
  //             return this.universitySpecificStats(userId, uniIdOrObject, t);
  //         });
  //     } //END_tx precence check

  //     let uni: UniversityDto;

  //     //Check if id or object parsed
  //     if (typeof uniIdOrObject === 'string'){
  //         //Fetch the uni
  //         uni = await this.uniService.getById(uniIdOrObject, tx);
  //     } else {
  //         uni = uniIdOrObject;
  //     }

  //     let response: UniversityStatsSingleResponseDto = {
  //         UniversityID: uni.UniversityID,
  //         UniversityName: uni.UniversityName
  //     };

  //     //Fetch courses
  //     const course = await this.courseService
  //         .getAllV2(userId, {UniversityID: uni.UniversityID, Stats: true}, tx);

  //     if (course.count)
  //         response.countCourses = course.count;

  //     //Fetch Modules
  //     const modules = await this.moduleService
  //         .getAll(userId, {universityId: uni.UniversityID, Stats: true});

  //     if (modules.count)
  //         response.countModules = modules.count;

  //     return response;
  // }//END_universitySpecificStats

  //Courses

  //Modules

  //Events
} //END_Analytics
