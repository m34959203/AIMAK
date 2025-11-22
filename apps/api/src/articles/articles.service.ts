import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateArticleDto, ArticleStatus } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import axios from 'axios';

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

  async findAll(filters?: {
    published?: boolean;
    isBreaking?: boolean;
    isFeatured?: boolean;
    isPinned?: boolean;
    categorySlug?: string;
  }) {
    const where: any = {};

    if (filters?.published !== undefined) {
      where.published = filters.published;
    }

    if (filters?.isBreaking !== undefined) {
      where.isBreaking = filters.isBreaking;
    }

    if (filters?.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (filters?.isPinned !== undefined) {
      where.isPinned = filters.isPinned;
    }

    if (filters?.categorySlug) {
      where.category = {
        slug: filters.categorySlug,
      };
    }

    return this.prisma.article.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
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
      orderBy: [
        // Pinned articles first
        { isPinned: 'desc' },
        // Then by creation date
        { createdAt: 'desc' },
      ],
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

  async analyzeArticle(dto: AnalyzeArticleDto) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new BadRequestException(
        'AI editor is not configured. Please contact the administrator to set up the OPENROUTER_API_KEY environment variable.',
      );
    }

    // Prepare content for analysis
    const kazakh = {
      title: dto.titleKz,
      excerpt: dto.excerptKz || '',
      content: dto.contentKz,
    };

    const russian = dto.titleRu && dto.contentRu
      ? {
          title: dto.titleRu,
          excerpt: dto.excerptRu || '',
          content: dto.contentRu,
        }
      : null;

    const prompt = `You are an expert content editor for a bilingual news website (Kazakh/Russian). Analyze the following article and provide constructive suggestions for improvement.

ARTICLE (Kazakh):
Title: ${kazakh.title}
${kazakh.excerpt ? `Excerpt: ${kazakh.excerpt}` : ''}
Content: ${kazakh.content}

${russian ? `ARTICLE (Russian):
Title: ${russian.title}
${russian.excerpt ? `Excerpt: ${russian.excerpt}` : ''}
Content: ${russian.content}` : ''}

Please analyze and provide suggestions in the following categories:

1. STRUCTURE (Структура):
   - Is the article well-organized?
   - Does it have a clear introduction, body, and conclusion?
   - Are paragraphs logically structured?

2. CONTENT QUALITY (Качество контента):
   - Is the information clear and comprehensive?
   - Are there any gaps in the story?
   - Is the tone appropriate for news content?

3. TITLE & EXCERPT (Заголовок и описание):
   - Is the title attention-grabbing yet accurate?
   - Does the excerpt effectively summarize the article?
   - Suggest improvements if needed

4. LANGUAGE & STYLE (Язык и стиль):
   - Check for clarity and readability
   - Are there any grammar or style issues?
   - Is the language professional and engaging?

5. BILINGUAL CONSISTENCY (Двуязычная согласованность):
   ${russian ? '- Are the Kazakh and Russian versions consistent?\n   - Do both versions convey the same message?' : '- Russian version is missing. Recommend adding it for wider reach.'}

6. SEO & READABILITY (SEO и читабельность):
   - Is the content optimized for search engines?
   - Are there keywords that should be emphasized?
   - Is the text easy to read and scan?

Return your analysis as a JSON object with this EXACT structure (respond in Russian):
{
  "score": 85,
  "summary": "Краткое общее резюме анализа",
  "suggestions": [
    {
      "category": "Структура",
      "severity": "medium",
      "title": "Короткое название проблемы",
      "description": "Детальное описание и рекомендации"
    }
  ],
  "strengths": [
    "Сильная сторона 1",
    "Сильная сторона 2"
  ],
  "improvements": {
    "title": "Улучшенный вариант заголовка (опционально)",
    "excerpt": "Улучшенный вариант описания (опционально)"
  }
}

severity levels: "low", "medium", "high"
categories: "Структура", "Контент", "Заголовок", "Язык", "SEO", "Двуязычность"

Return ONLY the JSON object, no additional text.`;

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

      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return analysis;
    } catch (error) {
      console.error('Error analyzing article:', error);

      // Provide more detailed error information
      if (error.response) {
        console.error('API Response Error:', error.response.data);
        throw new BadRequestException(
          `AI service error: ${error.response.data?.error?.message || 'Unknown error from AI service'}`,
        );
      }

      if (error.message?.includes('Failed to parse')) {
        throw new BadRequestException(
          'AI returned invalid response format. Please try again or contact support.',
        );
      }

      throw new BadRequestException(
        'Failed to analyze article. Please try again later or contact support if the problem persists.',
      );
    }
  }
}
