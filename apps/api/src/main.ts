import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

// Функция для получения разрешенных origins
function getAllowedOrigins(): string[] {
  const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '';

  // Поддержка нескольких origins через запятую
  const origins = corsOrigin.split(',').map(url => {
    let trimmedUrl = url.trim();

    // Если это только имя сервиса (без точек), добавляем .onrender.com
    if (trimmedUrl && !trimmedUrl.includes('.') && !trimmedUrl.startsWith('http') && !trimmedUrl.includes('localhost')) {
      trimmedUrl = `${trimmedUrl}.onrender.com`;
    }

    // Если URL не начинается с http, добавляем https://
    if (trimmedUrl && !trimmedUrl.startsWith('http')) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    return trimmedUrl;
  }).filter(url => url);

  // Добавляем известные домены для production
  const knownOrigins = [
    'https://aimak-web-rvep.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  // Объединяем и убираем дубликаты
  const allOrigins = [...new Set([...origins, ...knownOrigins])];

  return allOrigins;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded files statically
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  console.log(`Serving static files from: ${uploadsPath}`);

  const allowedOrigins = getAllowedOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      // Разрешаем запросы без origin (например, мобильные приложения, Postman)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  console.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);

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
