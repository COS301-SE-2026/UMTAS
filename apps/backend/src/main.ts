import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { collectDefaultMetrics, register } from 'prom-client';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  console.log(`[STARTUP] Listening on port ${port}`);

  app.enableCors({
    origin: [
      process.env.CORS_ORIGIN ?? 'http://localhost:3001',
      'https://cos301-se-2026.github.io',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('UMTAS API').setVersion('1.0').build(),
  );
  SwaggerModule.setup('api-docs', app, document);

  collectDefaultMetrics();
  app.getHttpAdapter().get('/metrics', async (_req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  await app.listen(port);
}
bootstrap().catch((err) => {
  console.error('Failed to start app', err);
  process.exit(1);
});
