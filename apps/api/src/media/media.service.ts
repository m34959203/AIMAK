import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { extname } from 'path';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async saveMediaFile(file: Express.Multer.File, userId: string) {
    const ext = extname(file.originalname);

    // Construct full URL with protocol
    let baseUrl = process.env.APP_URL || 'http://localhost:4000';

    // Ensure baseUrl has protocol (Render provides hostname without https://)
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }

    // Remove trailing /api if present
    baseUrl = baseUrl.replace(/\/api\/?$/, '');

    const url = `${baseUrl}/uploads/${file.filename}`;

    // Get image dimensions if available
    let width: number | undefined;
    let height: number | undefined;

    // For now, we'll save basic file info
    // In production, you might want to use sharp or another library to get dimensions

    const mediaFile = await this.prisma.mediaFile.create({
      data: {
        filename: file.filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        width,
        height,
        url,
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
