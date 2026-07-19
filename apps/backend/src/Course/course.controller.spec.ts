// import { CourseController } from './course.controller';
// import { CourseService } from './course.service';

// import { Test } from '@nestjs/testing';

// //constants

// //mock services
// import { createMockCourseService } from '../Testing/Mocks/services';

// //Factories
// // import { createMockSession, createModule } from '../Testing/Factories';

// //DTo's
// import {
//   //  CourseDto,
//   CourseFilters,
//   CourseSingleResponseDto,
//   DeleteCourseResponseDto,
//   //   CourseListResponseDto,UpdateCourseDto,
//   CreateCourseDto,
//   CourseListResponseDto,
// } from './dto/course.dto';

// describe('CourseController', () => {
//   let controller: CourseController;
//   // let service: CourseService;

//   //mock services
//   const { mockCourseService, reset: resetCourse } = createMockCourseService();

//   //const mockSession = createMockSession('someUserId', 'uni_admin');

//   //Before
//   beforeEach(async () => {
//     const module = await Test.createTestingModule({
//       controllers: [CourseController],
//       providers: [{ provide: CourseService, useValue: mockCourseService }],
//     }).compile();

//     controller = module.get<CourseController>(CourseController);
//     // service = module.get<CourseService>(CourseService);
//   }); //END_BeforeEach

//   //after
//   afterEach(() => {
//     resetCourse();
//     jest.clearAllMocks();
//   }); //END_afterEach

//   //TESTS

//   describe('TEST_create', () => {
//     it('should create course', async () => {
//       const createDto: CreateCourseDto = {
//         UniversityID: 'someUniversityId',
//         GroupID: 'someGroupId',
//         CourseName: 'Computer Science',
//         Degree: 'Bachelor of Science',
//       };

//       const expectedResponse: CourseSingleResponseDto = {
//         UniversityID: 'someUniversityId',
//         GroupID: 'someGroupId',
//         CourseID: 'someCourseId',
//         CourseName: 'Computer Science',
//         Degree: 'Bachelor of Science',
//       };

//       mockCourseService.create?.mockResolvedValue(expectedResponse);

//       const result = await controller.create(createDto);

//       expect(result).toEqual(expectedResponse);
//       expect(mockCourseService.create).toHaveBeenCalledWith(createDto);
//     });
//   });

//   describe('TEST_getAll', () => {
//     it('should return all courses', async () => {
//       const filters: CourseFilters = {
//         UniversityID: 'someUniversityId',
//       };

//       const expectedResponse: CourseListResponseDto = {
//         courses: [
//           {
//             UniversityID: 'someUniversityId',
//             GroupID: 'someGroupId',
//             CourseID: 'someCourseId',
//             CourseName: 'Computer Science',
//             Degree: 'Bachelor of Science',
//           },
//         ],
//       };

//       mockCourseService.getAll?.mockResolvedValue(expectedResponse);

//       const result = await controller.getAll(filters);

//       expect(result).toEqual(expectedResponse);
//       expect(mockCourseService.getAll).toHaveBeenCalledWith(filters);
//     });
//   });

//   describe('Test_getById', () => {
//     it('should return a course by ID', async () => {
//       const courseId = 'someCourseId';

//       const expectedResponse: CourseSingleResponseDto = {
//         UniversityID: 'someUniversityId',
//         GroupID: 'someGroupId',
//         CourseID: courseId,
//         CourseName: 'Computer Science',
//         Degree: 'Bachelor of Science',
//       };

//       mockCourseService.getById?.mockResolvedValue(expectedResponse);

//       const result = await controller.getById(courseId);

//       expect(result).toEqual(expectedResponse);
//       expect(mockCourseService.getById).toHaveBeenCalledWith(courseId);
//     });
//   });

//   describe('TEST_update', () => {
//     it('should update a course', async () => {
//       const courseId = 'someCourseId';
//       const updateDto = {
//         CourseName: 'Updated Course Name',
//         Degree: 'Updated Degree',
//       };

//       const expectedResponse: CourseSingleResponseDto = {
//         UniversityID: 'someUniversityId',
//         GroupID: 'someGroupId',
//         CourseID: courseId,
//         CourseName: updateDto.CourseName,
//         Degree: updateDto.Degree,
//       };

//       mockCourseService.update?.mockResolvedValue(expectedResponse);

//       const result = await controller.update(courseId, updateDto);

//       expect(result).toEqual(expectedResponse);
//       expect(mockCourseService.update).toHaveBeenCalledWith(
//         courseId,
//         updateDto,
//       );
//     });
//   });

//   describe('TEST_delete', () => {
//     it('should delete a course', async () => {
//       const courseId = 'someCourseId';

//       const expectedResponse: DeleteCourseResponseDto = {
//         CourseName: 'Computer Science',
//         success: true,
//       };

//       mockCourseService.delete?.mockResolvedValue(expectedResponse);

//       const result = await controller.delete(courseId);

//       expect(result).toEqual(expectedResponse);
//       expect(mockCourseService.delete).toHaveBeenCalledWith(courseId);
//     });
//   });
// });
