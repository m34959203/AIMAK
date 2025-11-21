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
    // Проверка на уникальность комбинации year-month-issueNumber
    const existingIssue = await this.prisma.magazineIssue.findUnique({
      where: {
        year_month_issueNumber: {
          year: dto.year,
          month: dto.month,
          issueNumber: dto.issueNumber,
        },
      },
    });

    if (existingIssue) {
      throw new BadRequestException(
        `Выпуск №${dto.issueNumber} за ${dto.month}/${dto.year} уже существует`,
      );
    }

    // Получить базовый URL для формирования ссылки на PDF
    const baseUrl = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000';
    const normalizedBaseUrl = this.normalizeUrl(baseUrl);
    const pdfUrl = `${normalizedBaseUrl}/uploads/magazines/${pdfFile.filename}`;

    // Создать запись в БД
    const issue = await this.prisma.magazineIssue.create({
      data: {
        issueNumber: dto.issueNumber,
        year: dto.year,
        month: dto.month,
        publishDate: new Date(dto.publishDate),
        titleKz: dto.titleKz,
        titleRu: dto.titleRu,
        descriptionKz: dto.descriptionKz,
        descriptionRu: dto.descriptionRu,
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
    const where: any = {};

    if (published !== undefined) {
      where.isPublished = published;
    }

    return this.prisma.magazineIssue.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { year: 'desc' },
        { month: 'desc' },
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

    return issue;
  }

  /**
   * Получить выпуски по году
   */
  async findByYear(year: number) {
    return this.prisma.magazineIssue.findMany({
      where: {
        year,
        isPublished: true,
      },
      orderBy: [
        { month: 'desc' },
        { issueNumber: 'desc' },
      ],
    });
  }

  /**
   * Обновить выпуск
   */
  async update(id: string, dto: UpdateMagazineIssueDto) {
    const issue = await this.findOne(id);

    // Если изменяются year, month, issueNumber - проверить уникальность
    if (dto.year !== undefined || dto.month !== undefined || dto.issueNumber !== undefined) {
      const year = dto.year ?? issue.year;
      const month = dto.month ?? issue.month;
      const issueNumber = dto.issueNumber ?? issue.issueNumber;

      const existingIssue = await this.prisma.magazineIssue.findUnique({
        where: {
          year_month_issueNumber: { year, month, issueNumber },
        },
      });

      if (existingIssue && existingIssue.id !== id) {
        throw new BadRequestException(
          `Выпуск №${issueNumber} за ${month}/${year} уже существует`,
        );
      }
    }

    return this.prisma.magazineIssue.update({
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
    return this.prisma.magazineIssue.update({
      where: { id },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Увеличить счетчик скачиваний
   */
  async incrementDownloads(id: string) {
    return this.prisma.magazineIssue.update({
      where: { id },
      data: {
        downloadsCount: {
          increment: 1,
        },
      },
    });
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
