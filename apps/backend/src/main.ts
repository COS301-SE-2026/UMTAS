import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { collectDefaultMetrics, register } from 'prom-client';
import type { Request, Response } from 'express';
import { join } from 'path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { AppModule } from './app.module';
import { DatabaseService } from './db/database.service';
import { DB_MODES } from './db/database.constants';
import {
  swaggerCustomCss,
  swaggerCustomJs,
  swaggerFaviconUrl,
} from './swagger-theme';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'public'));
  const port = process.env.PORT ?? 3001;

  if (process.env.NODE_ENV !== 'production') {
    const dbService = app.get(DatabaseService);
    if (dbService.dbMode !== DB_MODES.PGLITE) {
      await migrate(dbService.db as any, {
        migrationsFolder: join(__dirname, '..', 'drizzle'),
      });
      console.log('[STARTUP] Database migrations applied');
    }
  }

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
    .addServer('https://api.capstone-vigil.dns.net.za', 'Production')
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

  console.log(
    `[STARTUP] Swagger docs available at http://localhost:${port}/api/docs`,
  );
  console.log(`[STARTUP] Listening on port ${port}`);

  await app.listen(port);
}

bootstrap().catch((err) => {
  console.error('Failed to start app', err);
  process.exit(1);
});
