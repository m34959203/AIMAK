import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Функция для правильного формирования Frontend URL
function getFrontendUrl(): string {
  const frontendUrl = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000';
  let url = frontendUrl.trim();

  // Если это только имя сервиса (без точек), добавляем .onrender.com
  if (!url.includes('.') && !url.startsWith('http') && !url.includes('localhost')) {
    url = `${url}.onrender.com`;
  }

  // Если URL не начинается с http, добавляем https://
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }

  return url;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendUrl = getFrontendUrl();

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  console.log(`CORS enabled for origin: ${frontendUrl}`);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Aimak Akshamy API')
    .setDescription('API for city newspaper')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
