import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3001;

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Swagger/OpenAPI documentation
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
    .addServer('https://api.umtas.co.za', 'Production')
    .addTag('Health', 'System health checks')
    .addTag('Auth', 'Authentication endpoints (BetterAuth)')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      defaultModelsExpandDepth: 2,
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
