import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { collectDefaultMetrics, register } from 'prom-client';
import type { Request, Response } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import {
  swaggerCustomCss,
  swaggerCustomJs,
  swaggerFaviconUrl,
} from './swagger-theme';

import { ValidationPipe } from '@nestjs/common';

import { mkdirSync, writeFileSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();

  app.setGlobalPrefix('api', {
    exclude: ['metrics'],
  });
  app.use((req: Request, _res: Response, next: () => void) => {
    console.log('REQ:', req.method, req.originalUrl);
    next();
  });

  app.set('trust proxy', 1);
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
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

  collectDefaultMetrics();
  app.getHttpAdapter().get('/metrics', async (_req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
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

  generateOpenapi(document);

  console.log(
    `[STARTUP] Swagger docs available at http://localhost:${port}/api/docs`,
  );
  console.log(`[STARTUP] Listening on port ${port}`);
  // console.log(process.env); // everything

  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.error('Failed to start app', err);
  process.exit(1);
});

function generateOpenapi(document: OpenAPIObject) {
  // writeFileSync('./openapi.json', JSON.stringify(document, null, 2));

  const outDir = './docs';

  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, 'openapi.json'),
    JSON.stringify(document, null, 2),
  );
}
