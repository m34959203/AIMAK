import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { GenerateTagsDto } from './dto/generate-tags.dto';
import axios from 'axios';

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

  async generateTags(dto: GenerateTagsDto) {
    // Support both OPENROUTER_API_KEY and OPENAI_API_KEY for compatibility
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured. Please set OPENROUTER_API_KEY or OPENAI_API_KEY environment variable.');
    }

    // Get existing tags to help AI suggest relevant ones
    const existingTags = await this.prisma.tag.findMany({
      select: {
        nameKz: true,
        nameRu: true,
      },
    });

    const existingTagsList = existingTags
      .map((tag) => `${tag.nameKz} / ${tag.nameRu}`)
      .join(', ');

    // Prepare content for analysis
    const contentKz = `${dto.titleKz}\n\n${dto.contentKz}`;
    const contentRu = dto.titleRu && dto.contentRu
      ? `${dto.titleRu}\n\n${dto.contentRu}`
      : '';

    const prompt = `Analyze the following article and suggest 3-5 relevant tags in both Kazakh and Russian languages.

Article (Kazakh):
${contentKz}

${contentRu ? `Article (Russian):\n${contentRu}\n` : ''}

Existing tags in the system (for reference):
${existingTagsList || 'No existing tags'}

Instructions:
1. Suggest 3-5 tags that best describe the article's main topics/themes
2. Each tag should be in both Kazakh (nameKz) and Russian (nameRu)
3. Try to match existing tags when appropriate, but you can also suggest new ones
4. Keep tags concise (1-3 words max)
5. Focus on key topics, not general words
6. Return ONLY a valid JSON array in this exact format, no other text:
[
  {"nameKz": "Саясат", "nameRu": "Политика"},
  {"nameKz": "Экономика", "nameRu": "Экономика"}
]

Return only the JSON array, no explanations or additional text.`;

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemma-2-27b-it',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
            'X-Title': 'AIMAK News',
          },
        },
      );

      const aiResponse = response.data.choices[0].message.content;

      // Extract JSON from the response (in case AI adds any extra text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const suggestedTags = JSON.parse(jsonMatch[0]);

      // Match suggested tags with existing tags
      const matchedTags = [];
      const newTags = [];

      for (const suggested of suggestedTags) {
        const existing = existingTags.find(
          (tag) =>
            tag.nameKz.toLowerCase() === suggested.nameKz.toLowerCase() ||
            tag.nameRu.toLowerCase() === suggested.nameRu.toLowerCase(),
        );

        if (existing) {
          matchedTags.push(existing);
        } else {
          newTags.push(suggested);
        }
      }

      return {
        existing: matchedTags,
        suggested: newTags,
      };
    } catch (error) {
      console.error('Error generating tags:', error);
      throw new Error('Failed to generate tags. Please try again.');
    }
  }
}
