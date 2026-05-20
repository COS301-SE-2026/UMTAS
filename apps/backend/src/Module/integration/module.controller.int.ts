// import { INestApplication } from '@nestjs/common';
// import { Test, TestingModule } from '@nestjs/testing';

// import request from 'supertest';

// import { APP_GUARD } from '@nestjs/core';
// import { ConfigModule } from '@nestjs/config';
// import { DatabaseModule } from '../../db/database.module';
// import {ModuleModule} from '../module.module';

// import { AuthController } from '../../auth/auth.controller';
// import { AuthService } from '../../auth/auth.service';
// import { AuthGuard } from '../../auth/auth.guard';
// import { RolesGuard } from '../../auth/roles.guard';

// import {ConfigService} from '@nestjs/config';

// import { MailerService } from '@nestjs-modules/mailer';

// describe('Module-controller integration', () => {
//   let app: INestApplication;
//   let authCookie: string;

//   beforeAll(async () => {

//     //build nest - test mode
//     const moduleFixture = await Test.createTestingModule({
//       imports: [
//         ConfigModule.forRoot({
//           isGlobal: true,
//           envFilePath: [
//             '.env',
//             '.env.local',
//             '../../.env',
//             '../../.env.local',
//           ],
//         }),
//         DatabaseModule,
//         ModuleModule,
//       ],
//       controllers: [AuthController],
//       providers: [
//         AuthService,

//         {
//           provide: MailerService,
//           useValue: {
//             sendMail: async () => Promise.resolve(),
//           },
//         },

//         {
//           provide: APP_GUARD,
//           useClass: AuthGuard,
//         },
//         {
//           provide: APP_GUARD,
//           useClass: RolesGuard,
//         },
//       ],
//     }).compile();

//     //create HTTP application
//     app = moduleFixture.createNestApplication();

//     //boot app
//     await app.init();

//     const config = app.get(ConfigService);

//     const email = config.get<string>('SEED_SYSTEM_ADMIN_EMAIL');
//     const password = config.get<string>('SEED_SYSTEM_ADMIN_PASSWORD');

//     if (!email || !password)
//       throw new Error('Missing TEST_USER_EMAIL or TEST_USER_PASSWORD');

//     //seed test user

//     const loginRes = await request(app.getHttpServer())
//     .post('/api/auth/sign-in/email')
//     .set('Content-Type', 'application/json; charset=utf-8')
//     .send({
//       email,
//       password,
//     })
//     .expect(200);

//     authCookie = loginRes.headers['set-cookie'];
//   });

//   afterAll(async () => { await app?.close(); });

//   it('POST /modules -> create module', async () => {

//     await request(app.getHttpServer())
//       .post('/modules')
//       .set('Cookie', authCookie)
//       .send({
//         code: "COS301",
//         name: "Software engineering",
//         description: 'Capstone mensies'
//       }).expect(201);
//   });
// });
