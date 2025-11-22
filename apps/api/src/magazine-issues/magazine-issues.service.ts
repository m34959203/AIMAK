import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateMagazineIssueDto } from './dto/create-magazine-issue.dto';
import { UpdateMagazineIssueDto } from './dto/update-magazine-issue.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MagazineIssuesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создать новый выпуск журнала
   */
  async create(dto: CreateMagazineIssueDto, pdfFile: Express.Multer.File, userId: string) {
    // Получить базовый URL для формирования ссылки на PDF
    const baseUrl = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000';
    const normalizedBaseUrl = this.normalizeUrl(baseUrl);
    const pdfUrl = `${normalizedBaseUrl}/uploads/magazines/${pdfFile.filename}`;

    // Создать запись в БД
    const issue = await this.prisma.magazineIssue.create({
      data: {
        issueNumber: dto.issueNumber,
        publishDate: new Date(dto.publishDate),
        titleKz: dto.titleKz,
        titleRu: dto.titleRu,
        pdfFilename: pdfFile.filename,
        pdfUrl,
        fileSize: pdfFile.size,
        pagesCount: dto.pagesCount,
        coverImageUrl: dto.coverImageUrl,
        isPublished: dto.isPublished ?? true,
        isPinned: dto.isPinned ?? false,
        uploadedById: userId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return issue;
  }

  /**
   * Получить все выпуски (с фильтрацией)
   */
  async findAll(published?: boolean) {
    try {
      const where: any = {};

      if (published !== undefined) {
        where.isPublished = published;
      }

      const issues = await this.prisma.magazineIssue.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { publishDate: 'desc' },
          { issueNumber: 'desc' },
        ],
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Fix PDF URLs for all issues
      const baseUrl = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000';
      const normalizedBaseUrl = this.normalizeUrl(baseUrl);

      return issues.map(issue => ({
        ...issue,
        pdfUrl: `${normalizedBaseUrl}/uploads/magazines/${issue.pdfFilename}`,
      }));
    } catch (error) {
      console.error('Error in magazineIssuesService.findAll:', error);
      // Возвращаем пустой массив вместо ошибки, если таблица пуста
      return [];
    }
  }

  /**
   * Получить один выпуск по ID
   */
  async findOne(id: string) {
    const issue = await this.prisma.magazineIssue.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!issue) {
      throw new NotFoundException(`Выпуск с ID ${id} не найден`);
    }

    // Fix PDF URL
    const baseUrl = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000';
    const normalizedBaseUrl = this.normalizeUrl(baseUrl);

    return {
      ...issue,
      pdfUrl: `${normalizedBaseUrl}/uploads/magazines/${issue.pdfFilename}`,
    };
  }


  /**
   * Обновить выпуск
   */
  async update(id: string, dto: UpdateMagazineIssueDto) {
    await this.findOne(id);

    const updated = await this.prisma.magazineIssue.update({
      where: { id },
      data: {
        ...dto,
        publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Fix PDF URL
    const baseUrl = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000';
    const normalizedBaseUrl = this.normalizeUrl(baseUrl);

    return {
      ...updated,
      pdfUrl: `${normalizedBaseUrl}/uploads/magazines/${updated.pdfFilename}`,
    };
  }

  /**
   * Удалить выпуск
   */
  async remove(id: string) {
    const issue = await this.findOne(id);

    // Удалить PDF файл с диска
    try {
      const filePath = join(process.cwd(), 'uploads', 'magazines', issue.pdfFilename);
      await unlink(filePath);
    } catch (error) {
      console.error(`Не удалось удалить файл ${issue.pdfFilename}:`, error);
      // Продолжаем удаление записи из БД даже если файл не удален
    }

    // Удалить запись из БД
    await this.prisma.magazineIssue.delete({
      where: { id },
    });

    return { message: 'Выпуск успешно удален' };
  }

  /**
   * Увеличить счетчик просмотров
   */
  async incrementViews(id: string) {
    // Проверить существование записи
    const issue = await this.prisma.magazineIssue.findUnique({
      where: { id },
    });

    if (!issue) {
      throw new NotFoundException(`Выпуск с ID ${id} не найден`);
    }

    const updated = await this.prisma.magazineIssue.update({
      where: { id },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });

    // Fix PDF URL
    const baseUrl = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000';
    const normalizedBaseUrl = this.normalizeUrl(baseUrl);

    return {
      ...updated,
      pdfUrl: `${normalizedBaseUrl}/uploads/magazines/${updated.pdfFilename}`,
    };
  }

  /**
   * Увеличить счетчик скачиваний
   */
  async incrementDownloads(id: string) {
    // Проверить существование записи
    const issue = await this.prisma.magazineIssue.findUnique({
      where: { id },
    });

    if (!issue) {
      throw new NotFoundException(`Выпуск с ID ${id} не найден`);
    }

    const updated = await this.prisma.magazineIssue.update({
      where: { id },
      data: {
        downloadsCount: {
          increment: 1,
        },
      },
    });

    // Fix PDF URL
    const baseUrl = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000';
    const normalizedBaseUrl = this.normalizeUrl(baseUrl);

    return {
      ...updated,
      pdfUrl: `${normalizedBaseUrl}/uploads/magazines/${updated.pdfFilename}`,
    };
  }

  /**
   * Нормализация URL (удаление /api, trailing slash, добавление протокола)
   */
  private normalizeUrl(url: string): string {
    let normalized = url.trim();

    // Add protocol if missing
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }

    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');

    // Remove /api suffix if present
    normalized = normalized.replace(/\/api$/, '');

    return normalized;
  }
}
