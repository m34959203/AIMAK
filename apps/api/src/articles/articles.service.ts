import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-zа-яәіңғүұқөһ0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(dto: CreateArticleDto, authorId: string) {
    const slugKz = this.generateSlug(dto.title);

    const article = await this.prisma.article.create({
      data: {
        titleKz: dto.title,
        slugKz,
        contentKz: dto.content,
        excerptKz: dto.excerpt,
        coverImage: dto.coverImage,
        published: dto.published || false,
        status: dto.published ? 'PUBLISHED' : 'DRAFT',
        publishedAt: dto.published ? new Date() : null,
        authorId,
        categoryId: dto.categoryId,
        tags: dto.tagIds
          ? {
              connect: dto.tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        tags: true,
      },
    });

    return article;
  }

  async findAll(published?: boolean) {
    return this.prisma.article.findMany({
      where: published !== undefined ? { published } : undefined,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        tags: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        tags: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Increment views
    await this.prisma.article.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return article;
  }

  async findBySlug(slug: string) {
    // Try Kazakh slug first
    let article = await this.prisma.article.findUnique({
      where: { slugKz: slug },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        tags: true,
      },
    });

    // If not found, try Russian slug
    if (!article) {
      article = await this.prisma.article.findUnique({
        where: { slugRu: slug },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          category: true,
          tags: true,
        },
      });
    }

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Increment views
    await this.prisma.article.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    });

    return article;
  }

  async update(id: string, dto: UpdateArticleDto, userId: string, userRole: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own articles');
    }

    const updateData: any = {};

    // Map old fields to new bilingual fields
    if (dto.title) {
      updateData.titleKz = dto.title;
      updateData.slugKz = this.generateSlug(dto.title);
    }

    if (dto.content) {
      updateData.contentKz = dto.content;
    }

    if (dto.excerpt) {
      updateData.excerptKz = dto.excerpt;
    }

    if (dto.coverImage !== undefined) {
      updateData.coverImage = dto.coverImage;
    }

    if (dto.categoryId) {
      updateData.categoryId = dto.categoryId;
    }

    if (dto.published !== undefined) {
      updateData.published = dto.published;
      updateData.status = dto.published ? 'PUBLISHED' : 'DRAFT';

      if (dto.published && !article.published) {
        updateData.publishedAt = new Date();
      }
    }

    if (dto.tagIds) {
      updateData.tags = {
        set: [],
        connect: dto.tagIds.map((id) => ({ id })),
      };
    }

    return this.prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        tags: true,
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own articles');
    }

    await this.prisma.article.delete({
      where: { id },
    });

    return { message: 'Article deleted successfully' };
  }
}
