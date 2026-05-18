/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
// jest.mock hoisted to top by Jest to stub better-auth/node
jest.mock('better-auth/node', () => ({
  toNodeHandler: (h: unknown) => h,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { MailerService } from '../../src/mail/mailer.service';
import { createMockMailer } from '../utils/mailer.mock';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Tests Google OAuth routing and duplicate-email handling using mocked provider flow.

describe('Google OAuth (mocked)', () => {
  let app: INestApplication;
  let mockMailer: ReturnType<typeof createMockMailer>;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DB_MODE = 'PGLITE';

    // Ensure Google env present for positive path
    process.env.GOOGLE_CLIENT_ID = 'test-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret';

    mockMailer = createMockMailer();

    // Create a fake auth.handler that simulates BetterAuth behaviour for google endpoints
    const fakeHandler = jest.fn((req: IncomingMessage, res: ServerResponse) => {
      const url = (req as unknown as { url: string }).url || '';
      if (url.includes('/link-account/google')) {
        res.statusCode = 422;
        res.end(JSON.stringify({ error: 'EMAIL_ALREADY_IN_USE' }));
        return;
      }
      if (url.includes('/callback/google')) {
        res.statusCode = 302;
        res.end();
        return;
      }
      // default pass-through
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true }));
    });

    const mockAuthService = {
      getAuth: jest.fn(() => ({ handler: fakeHandler })),
    } as unknown as AuthService;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: MailerService, useValue: mockMailer },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  test('callback/google returns redirect when configured', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/auth/callback/google?code=abc&state=xyz',
    );
    expect([302]).toContain(res.status);
  });

  test('link-account/google returns 422 when duplicate email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/link-account/google')
      .send({ code: 'abc', state: 'xyz' });
    expect([422]).toContain(res.status);
    expect(res.body.error).toEqual('EMAIL_ALREADY_IN_USE');
  });
});
