import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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

  await app.listen(port);
}
bootstrap().catch((err) => {
  console.error('Failed to start app', err);
  process.exit(1);
});
