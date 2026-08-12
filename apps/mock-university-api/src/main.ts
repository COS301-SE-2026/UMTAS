import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Swagger config
  const config = new DocumentBuilder()
    .setTitle('The REAL NWU API')
    .setDescription('Mock university NWO API for UMTAS')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.listen(3010, '0.0.0.0');
}
bootstrap();
