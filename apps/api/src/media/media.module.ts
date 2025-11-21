import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { SupabaseModule } from '../common/supabase/supabase.module';

@Module({
  imports: [
    PrismaModule,
    SupabaseModule,
    MulterModule.register({
      storage: memoryStorage(), // Use memory storage for Supabase upload
      fileFilter: (
        req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
