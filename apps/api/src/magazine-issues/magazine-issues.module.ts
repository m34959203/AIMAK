import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Request } from 'express';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { MagazineIssuesController } from './magazine-issues.controller';
import { MagazineIssuesService } from './magazine-issues.service';
import { PrismaModule } from '../common/prisma/prisma.module';

// Создать директорию для PDF файлов журнала если её нет
const uploadsDir = './uploads/magazines';
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: diskStorage({
        destination: uploadsDir,
        filename: (
          req: Request,
          file: Express.Multer.File,
          callback: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const sanitizedName = file.originalname
            .replace(ext, '')
            .replace(/[^a-zA-Z0-9-_]/g, '-')
            .substring(0, 50);
          const filename = `magazine-${sanitizedName}-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (
        req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        // Разрешить только PDF файлы
        if (!file.originalname.match(/\.pdf$/i)) {
          return callback(new Error('Разрешены только PDF файлы!'), false);
        }

        // Проверка MIME type
        if (file.mimetype !== 'application/pdf') {
          return callback(new Error('Неверный MIME type. Разрешен только application/pdf'), false);
        }

        callback(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB (PDF журналов обычно больше 5MB)
      },
    }),
  ],
  controllers: [MagazineIssuesController],
  providers: [MagazineIssuesService],
  exports: [MagazineIssuesService],
})
export class MagazineIssuesModule {}
