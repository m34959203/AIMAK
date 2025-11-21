import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { extname } from 'path';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  async saveMediaFile(file: Express.Multer.File, userId: string) {
    // Upload to Supabase Storage
    const uploadResult = await this.supabaseService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    if (!uploadResult) {
      this.logger.error('Failed to upload file to Supabase');
      throw new Error('Failed to upload file');
    }

    this.logger.log(`File uploaded successfully: ${uploadResult.url}`);

    // Get image dimensions if available
    let width: number | undefined;
    let height: number | undefined;

    // Save metadata to database
    const mediaFile = await this.prisma.mediaFile.create({
      data: {
        filename: uploadResult.path,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        width,
        height,
        url: uploadResult.url,
        uploadedById: userId,
      },
    });

    return {
      id: mediaFile.id,
      url: mediaFile.url,
      filename: mediaFile.filename,
      originalFilename: mediaFile.originalFilename,
      mimeType: mediaFile.mimeType,
      size: mediaFile.size,
      width: mediaFile.width,
      height: mediaFile.height,
      createdAt: mediaFile.createdAt,
    };
  }

  async findOne(id: string) {
    return this.prisma.mediaFile.findUnique({
      where: { id },
    });
  }

  async findAll(userId?: string) {
    return this.prisma.mediaFile.findMany({
      where: userId ? { uploadedById: userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }
}
