// import {UniversityService} from './university.service';

// import {Test} from '@nestjs/testing';

// //constants
// import {userId, uniId} from '../Testing/constants.spec';

// //mock services
// import {createMockDatabase} from '../Testing/Mocks/database.mock';
// import {createMockUniversityService} from '../Testing/Mocks/services';
// import {DatabaseService} from '../db/database.service';

// //mock functions on db
// import {mockDbResult, mockSequentialResults} from '../Testing/Mocks';

// //factories
// import {createUniversity} from '../Testing/Factories';

// describe('UniversityService', () => {
//   let service: UniversityService;

//   //define mock services
//   const {mockDb, reset: resetDb} = createMockDatabase();
//   const {mockUniversityService, reset: resetUni} = createMockUniversityService();

//   //before
//   beforeEach(async () => {
//     const module = await Test.createTestingModule({
//       providers: [
//         UniversityService,
//         {provide: DatabaseService, useValue: {db: mockDb}},
//       ],
//     }).compile();

//     service = module.get(UniversityService);
//   }); //END_BeforeEach

//   //afterEach
//   afterEach(() => {
//     resetDb();
//     resetUni();
//   }); //END_afterEach

//   //TESTS

// });
