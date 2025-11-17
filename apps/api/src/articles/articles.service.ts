import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateArticleDto, ArticleStatus } from './dto/create-article.dto';
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
    const slugKz = this.generateSlug(dto.titleKz);
    const slugRu = dto.titleRu ? this.generateSlug(dto.titleRu) : undefined;

    // Determine status based on both status field and backward-compatible published field
    let status: ArticleStatus = dto.status || ArticleStatus.DRAFT;
    if (dto.published !== undefined) {
      status = dto.published ? ArticleStatus.PUBLISHED : ArticleStatus.DRAFT;
    }

    const article = await this.prisma.article.create({
      data: {
        // Kazakh content (required)
        titleKz: dto.titleKz,
        slugKz,
        contentKz: dto.contentKz,
        excerptKz: dto.excerptKz,

        // Russian content (optional)
        titleRu: dto.titleRu,
        slugRu,
        contentRu: dto.contentRu,
        excerptRu: dto.excerptRu,

        // Common fields
        coverImage: dto.coverImage,
        categoryId: dto.categoryId,

        // Status and flags
        status,
        published: status === 'PUBLISHED',
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        isBreaking: dto.isBreaking || false,
        isFeatured: dto.isFeatured || false,
        isPinned: dto.isPinned || false,
        allowComments: dto.allowComments !== false, // Default to true

        authorId,

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

    // Kazakh content
    if (dto.titleKz) {
      updateData.titleKz = dto.titleKz;
      updateData.slugKz = this.generateSlug(dto.titleKz);
    }

    if (dto.contentKz !== undefined) {
      updateData.contentKz = dto.contentKz;
    }

    if (dto.excerptKz !== undefined) {
      updateData.excerptKz = dto.excerptKz;
    }

    // Russian content
    if (dto.titleRu !== undefined) {
      updateData.titleRu = dto.titleRu;
      updateData.slugRu = dto.titleRu ? this.generateSlug(dto.titleRu) : null;
    }

    if (dto.contentRu !== undefined) {
      updateData.contentRu = dto.contentRu;
    }

    if (dto.excerptRu !== undefined) {
      updateData.excerptRu = dto.excerptRu;
    }

    // Common fields
    if (dto.coverImage !== undefined) {
      updateData.coverImage = dto.coverImage;
    }

    if (dto.categoryId) {
      updateData.categoryId = dto.categoryId;
    }

    // Status and flags
    if (dto.status) {
      updateData.status = dto.status;
      updateData.published = dto.status === 'PUBLISHED';

      if (dto.status === 'PUBLISHED' && article.status !== 'PUBLISHED') {
        updateData.publishedAt = new Date();
      }
    }

    // Backward compatibility with published field
    if (dto.published !== undefined && !dto.status) {
      updateData.published = dto.published;
      updateData.status = dto.published ? 'PUBLISHED' : 'DRAFT';

      if (dto.published && !article.published) {
        updateData.publishedAt = new Date();
      }
    }

    if (dto.isBreaking !== undefined) {
      updateData.isBreaking = dto.isBreaking;
    }

    if (dto.isFeatured !== undefined) {
      updateData.isFeatured = dto.isFeatured;
    }

    if (dto.isPinned !== undefined) {
      updateData.isPinned = dto.isPinned;
    }

    if (dto.allowComments !== undefined) {
      updateData.allowComments = dto.allowComments;
    }

    // Tags
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
