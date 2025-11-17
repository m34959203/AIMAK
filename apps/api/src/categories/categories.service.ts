import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-zа-яәіңғүұқөһ0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(dto: CreateCategoryDto) {
    const slug = this.generateSlug(dto.name);

    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: {
        nameKz: dto.name,
        nameRu: dto.name, // Use same name for now
        slug,
        descriptionKz: dto.description,
        descriptionRu: dto.description,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: { articles: true },
        },
      },
      orderBy: {
        nameKz: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        articles: {
          where: { published: true },
          select: {
            id: true,
            titleKz: true,
            titleRu: true,
            slugKz: true,
            slugRu: true,
            excerptKz: true,
            excerptRu: true,
            coverImage: true,
            publishedAt: true,
            author: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            publishedAt: 'desc',
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updateData: any = {};

    if (dto.name) {
      updateData.nameKz = dto.name;
      updateData.nameRu = dto.name; // Use same name for now
      updateData.slug = this.generateSlug(dto.name);
    }

    if (dto.description !== undefined) {
      updateData.descriptionKz = dto.description;
      updateData.descriptionRu = dto.description;
    }

    return this.prisma.category.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.articles > 0) {
      throw new ConflictException('Cannot delete category with existing articles');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }
}
