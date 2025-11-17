import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-zа-яәіңғүұқөһ0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(dto: CreateTagDto) {
    const slug = this.generateSlug(dto.name);

    const existingTag = await this.prisma.tag.findUnique({
      where: { slug },
    });

    if (existingTag) {
      throw new ConflictException('Tag with this name already exists');
    }

    return this.prisma.tag.create({
      data: {
        nameKz: dto.name,
        nameRu: dto.name, // Use same name for now
        slug,
      },
    });
  }

  async findAll() {
    return this.prisma.tag.findMany({
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
    const tag = await this.prisma.tag.findUnique({
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

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async update(id: string, dto: UpdateTagDto) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const updateData: any = {};

    if (dto.name) {
      const slug = this.generateSlug(dto.name);

      const existingTag = await this.prisma.tag.findUnique({
        where: { slug },
      });

      if (existingTag && existingTag.id !== id) {
        throw new ConflictException('Tag with this name already exists');
      }

      updateData.nameKz = dto.name;
      updateData.nameRu = dto.name; // Use same name for now
      updateData.slug = slug;
    }

    return this.prisma.tag.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    await this.prisma.tag.delete({
      where: { id },
    });

    return { message: 'Tag deleted successfully' };
  }
}
