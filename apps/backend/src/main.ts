import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  console.log(`[STARTUP] Listening on port ${port}`);

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  await app.listen(port);
}
bootstrap().catch((err) => {
  console.error('Failed to start app', err);
  process.exit(1);
});
