/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { MailerService } from '../../src/mail/mailer.service';
import { createMockMailer } from '../../test/utils/mailer.mock';
import { TEST_AUTH_DATA, TEST_PASSWORD } from '../../src/db/seeds/auth.seed';

describe('Auth e2e', () => {
  let app: INestApplication;
  let mockMailer: ReturnType<typeof createMockMailer>;

  beforeAll(async () => {
    process.env.DB_MODE = 'PGLITE';
    process.env.NODE_ENV = 'test';
    process.env.SEED = 'TRUE';
    process.env.SEED_TASKS = 'default-system-admin,auth-seed';

    mockMailer = createMockMailer();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailerService)
      .useValue(mockMailer)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    mockMailer.clear();
  });

  describe('Basic Flows', () => {
    test('sign-up → verify email → sign-in', async () => {
      const email = `e2e+${Date.now()}@example.com`;
      const password = 'Password1!';

      const signUpRes = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email,
          password,
          name: 'E2E User',
        });
      expect([200, 201]).toContain(signUpRes.status);
      expect(signUpRes.body.user.emailVerified).toBe(false);

      const sent = mockMailer.getSent();
      expect(sent.length).toBeGreaterThan(0);
      const verifyMail = sent[sent.length - 1];
      const code = verifyMail.context?.verifyUrl;
      expect(code).toBeTruthy();

      const verifyRes = await request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({ code });
      expect([200, 201]).toContain(verifyRes.status);

      const signInRes = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email, password });
      expect([200, 201]).toContain(signInRes.status);
      expect(signInRes.body.user).toBeDefined();
    }, 20000);

    test('sign-in before email verified → 400 EMAIL_NOT_VERIFIED', async () => {
      const email = `e2e+unverified${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({ email, password: 'Password1!', name: 'Unverified' });

      const signInRes = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email, password: 'Password1!' });
      expect(signInRes.status).toBe(400);
      expect(signInRes.body.error).toBe('EMAIL_NOT_VERIFIED');
    }, 10000);

    test('sign-up duplicate email → 422', async () => {
      const email = `e2e+dup${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({ email, password: 'Password1!', name: 'First' });

      const res = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email,
          password: 'Password1!',
          name: 'Second',
        });
      expect(res.status).toBe(422);
    }, 10000);

    test('sign-in with wrong password → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: 'nobody@example.com',
          password: 'WrongPass1!',
        });
      expect(res.status).toBe(401);
    });

    test('sign-in with seeded user → 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: TEST_AUTH_DATA.users.student.email,
          password: TEST_PASSWORD,
        });
      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(TEST_AUTH_DATA.users.student.id);
    });
  });

  describe('Session Management', () => {
    test('GET /session with no cookie → 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/auth/session');
      expect(res.status).toBe(401);
    });

    test('GET /session with valid cookie → 200', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.post('/api/auth/sign-in/email').send({
        email: TEST_AUTH_DATA.users.student.email,
        password: TEST_PASSWORD,
      });

      const res = await agent.get('/api/auth/session');
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
    });

    test('sign-out clears session', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.post('/api/auth/sign-in/email').send({
        email: TEST_AUTH_DATA.users.student.email,
        password: TEST_PASSWORD,
      });

      await agent.post('/api/auth/sign-out');
      const sessionRes = await agent.get('/api/auth/session');
      expect(sessionRes.status).toBe(401);
    }, 20000);

    test('list-sessions and revoke-session', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.post('/api/auth/sign-in/email').send({
        email: TEST_AUTH_DATA.users.student.email,
        password: TEST_PASSWORD,
      });

      const listRes = await agent.get('/api/auth/list-sessions');
      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body)).toBe(true);

      const sessionId = listRes.body[0]?.id;
      if (sessionId) {
        const revokeRes = await agent
          .post('/api/auth/revoke-session')
          .send({ sessionId });
        expect([200, 204]).toContain(revokeRes.status);
      }
    }, 20000);
  });

  describe('Admin Operations', () => {
    let sysAdminAgent: request.SuperAgentTest;

    beforeEach(async () => {
      sysAdminAgent = request.agent(app.getHttpServer());
      await sysAdminAgent.post('/api/auth/sign-in/email').send({
        email: TEST_AUTH_DATA.users.sysAdmin.email,
        password: TEST_PASSWORD,
      });
    });

    test('admin/create-user as sys_admin → 200', async () => {
      const res = await sysAdminAgent.post('/api/auth/admin/create-user').send({
        email: `new-user-${Date.now()}@example.com`,
        password: 'Password1!',
        name: 'New User',
        role: 'student',
      });
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
    });

    test('admin/create-user as uni_admin creating lecturer → 200', async () => {
      const uniAdminAgent = request.agent(app.getHttpServer());
      await uniAdminAgent.post('/api/auth/sign-in/email').send({
        email: TEST_AUTH_DATA.users.uniAdmin.email,
        password: TEST_PASSWORD,
      });

      const res = await uniAdminAgent.post('/api/auth/admin/create-user').send({
        email: `new-lecturer-${Date.now()}@example.com`,
        password: 'Password1!',
        name: 'New Lecturer',
        role: 'lecturer',
      });
      expect(res.status).toBe(200);
    });

    test('admin/create-user as uni_admin attempting sys_admin → 403', async () => {
      const uniAdminAgent = request.agent(app.getHttpServer());
      await uniAdminAgent.post('/api/auth/sign-in/email').send({
        email: TEST_AUTH_DATA.users.uniAdmin.email,
        password: TEST_PASSWORD,
      });

      const res = await uniAdminAgent.post('/api/auth/admin/create-user').send({
        email: `fake-admin-${Date.now()}@example.com`,
        password: 'Password1!',
        name: 'Fake Admin',
        role: 'sys_admin',
      });
      expect(res.status).toBe(403);
    });

    test('admin/ban-user as sys_admin → 200', async () => {
      const res = await sysAdminAgent.post('/api/auth/admin/ban-user').send({
        userId: TEST_AUTH_DATA.users.studentTwo.id,
        reason: 'Test ban',
      });
      expect(res.status).toBe(200);
      expect(res.body.user.banned).toBe(true);

      // Verify banned user cannot sign in
      const bannedRes = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: TEST_AUTH_DATA.users.studentTwo.email,
          password: TEST_PASSWORD,
        });
      expect(bannedRes.status).toBe(403);
      expect(bannedRes.body.error).toBe('USER_BANNED');
    });

    test('admin/impersonate-user as sys_admin → 200', async () => {
      const res = await sysAdminAgent
        .post('/api/auth/admin/impersonate-user')
        .send({
          userId: TEST_AUTH_DATA.users.student.id,
        });
      expect(res.status).toBe(200);
      // BetterAuth should return a new session for the target user
      expect(res.body.user.id).toBe(TEST_AUTH_DATA.users.student.id);
    });
  });

  describe('Role Boundaries', () => {
    test('student calls admin route → 403', async () => {
      const studentAgent = request.agent(app.getHttpServer());
      await studentAgent.post('/api/auth/sign-in/email').send({
        email: TEST_AUTH_DATA.users.student.email,
        password: TEST_PASSWORD,
      });

      const res = await studentAgent.post('/api/auth/admin/create-user').send({
        email: 'attacker@example.com',
        password: 'Password1!',
        name: 'Attacker',
        role: 'sys_admin',
      });
      expect(res.status).toBe(403);
    });

    test('lecturer calls admin route → 403', async () => {
      const lecturerAgent = request.agent(app.getHttpServer());
      await lecturerAgent.post('/api/auth/sign-in/email').send({
        email: TEST_AUTH_DATA.users.lecturer.email,
        password: TEST_PASSWORD,
      });

      const res = await lecturerAgent.post('/api/auth/admin/create-user').send({
        email: 'attacker@example.com',
        password: 'Password1!',
        name: 'Attacker',
        role: 'sys_admin',
      });
      expect(res.status).toBe(403);
    });
  });
});
