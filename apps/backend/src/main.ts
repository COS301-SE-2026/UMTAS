import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { PostHog } from 'posthog-node';
import { PostHogInterceptor } from 'posthog-node/nestjs';
import { collectDefaultMetrics, register } from 'prom-client';

import { AppModule } from './app.module';
import { StandardErrorFilter } from './common/standard-error.filter';
import { completeOpenApiContract } from './swagger-contract';
import {
  swaggerCustomCss,
  swaggerCustomJs,
  swaggerFaviconUrl,
} from './swagger-theme';

async function bootstrap() {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const ph = app.get(PostHog);
  app.useGlobalInterceptors(
    new PostHogInterceptor(ph, { captureExceptions: true }),
  );
  app.enableShutdownHooks();

  app.setGlobalPrefix('api', {
    exclude: ['metrics'],
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const { method, originalUrl } = req;

    console.log(`[REQ START] ${method} ${originalUrl}`);

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `[REQ END] ${method} ${originalUrl} ${res.statusCode} - ${duration}ms`,
      );
    });

    next();
  });

  app.set('trust proxy', 1);
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new StandardErrorFilter());
  const port = process.env.PORT ?? 3000;
  console.log(`[STARTUP] Starting UMTAS API on port ${port}...`);

  app.enableCors({
    origin: [
      process.env.CORS_ORIGIN ?? 'http://localhost:3001',
      'https://cos301-se-2026.github.io',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });
  register.clear();
  collectDefaultMetrics();
  app.getHttpAdapter().get('/metrics', async (_req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.status(200).send(metrics);
    } catch (err) {
      console.error('Error serving metrics:', err);
      res.status(500).send(err);
    }
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('UMTAS API')
    .setDescription('University Management Timetable & Scheduling System API')
    .setVersion('1.0.0')
    .addCookieAuth('umtas-session', {
      type: 'apiKey',
      in: 'cookie',
      description: 'Session cookie (set automatically by BetterAuth)',
    })
    .addBearerAuth(undefined, 'bearer')
    .addServer(`http://localhost:${port}`, 'Local development')
    .addServer('https://capstone-vigil.dns.net.za', 'Production')
    .addTag('Health', 'System health checks')
    .addTag('Auth Email', 'Email-based authentication and account management')
    .addTag('Auth Google', 'Google OAuth and account linking')
    .addTag('Auth Session', 'Session monitoring and management')
    .addTag('Auth Admin', 'Administrative user management')
    .addTag('Modules', 'Academic module management')
    .addTag('Events', 'Scheduling event management')
    .addTag('Timetables', 'Timetable generation and management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  completeOpenApiContract(document);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'UMTAS API Docs',
    customfavIcon: swaggerFaviconUrl,
    customCss: swaggerCustomCss,
    customJsStr: [swaggerCustomJs],
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      defaultModelsExpandDepth: 2,
      docExpansion: 'list',
      filter: true,
      tagsSorter: 'alpha',
    },
  });

  if (process.env.NODE_ENV === 'development') {
    await writeOpenApiDocument(document);
  }

  console.log(
    `[STARTUP] Swagger docs available at http://localhost:${port}/api/docs`,
  );
  console.log(`[STARTUP] Listening on port ${port}`);

  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.error('Failed to start app', err);
  process.exit(1);
});

async function writeOpenApiDocument(document: OpenAPIObject): Promise<void> {
  try {
    const outDir = './docs';
    await mkdir(outDir, { recursive: true });
    await writeFile(
      join(outDir, 'openapi.json'),
      JSON.stringify(document, null, 2),
    );
  } catch (error) {
    console.error('Failed to write OpenAPI spec:', error);
  }
}
