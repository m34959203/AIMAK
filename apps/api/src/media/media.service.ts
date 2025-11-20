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
    console.log('[MediaService] Original APP_URL:', baseUrl);

    // Ensure baseUrl has protocol (Render provides hostname without https://)
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }

    // Ensure .onrender.com domain is present if running on Render
    // The APP_URL from Render can be like: aimak-api-w8ps, aimak-api-w8ps.onrender.com, etc.
    if (baseUrl.includes('aimak-api') && !baseUrl.includes('.onrender.com')) {
      // Simply append .onrender.com if it's not already there
      baseUrl = baseUrl.replace(/^(https?:\/\/)?(.+?)(\/?$)/, (match, protocol, domain, slash) => {
        return `${protocol || 'https://'}${domain}.onrender.com${slash}`;
      });
      console.log('[MediaService] Added .onrender.com domain');
    }

    // Remove trailing /api if present
    baseUrl = baseUrl.replace(/\/api\/?$/, '');

    const url = `${baseUrl}/uploads/${file.filename}`;
    console.log('[MediaService] Final image URL:', url);

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
