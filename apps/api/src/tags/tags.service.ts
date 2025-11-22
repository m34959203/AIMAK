import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { GenerateTagsDto } from './dto/generate-tags.dto';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class TagsService {
  private geminiClient: GoogleGenerativeAI | null = null;

  constructor(private prisma: PrismaService) {
    // Initialize Google Gemini client if API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiApiKey);
    }
  }

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

    let aiResponse: string | null = null;

    // Try Google Gemini first if available
    if (this.geminiClient) {
      try {
        console.log('Using Google Gemini API for tag generation...');
        const model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        aiResponse = result.response.text();
        console.log('Google Gemini tag generation successful');
      } catch (error) {
        console.error('Google Gemini tag generation error:', error);
        // Fall through to OpenRouter
      }
    }

    // Fall back to OpenRouter if Gemini failed or unavailable
    if (!aiResponse) {
      const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
      if (!openRouterKey) {
        throw new Error('Translation service is not configured. Please set GEMINI_API_KEY or OPENROUTER_API_KEY environment variable.');
      }

      try {
        console.log('Using OpenRouter API for tag generation...');
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: process.env.OPENROUTER_MODEL || 'tngtech/deepseek-r1t2-chimera:free',
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          },
          {
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
              'X-Title': 'AIMAK News',
            },
          },
        );

        // Validate response structure
        if (!response.data?.choices || response.data.choices.length === 0) {
          console.error('Invalid OpenRouter response: no choices array');
          console.error('Response data:', JSON.stringify(response.data));
          throw new Error('Invalid response from OpenRouter: no choices');
        }

        const messageContent = response.data.choices[0]?.message?.content;
        if (!messageContent || messageContent.trim().length === 0) {
          console.error('Invalid OpenRouter response: empty content');
          console.error('Choices[0]:', JSON.stringify(response.data.choices[0]));
          throw new Error('Empty response from OpenRouter');
        }

        aiResponse = messageContent;
        console.log('OpenRouter tag generation successful');
        console.log('Response preview:', messageContent.substring(0, 200));
      } catch (error) {
        console.error('OpenRouter tag generation error:', error);
        if (axios.isAxiosError(error) && error.response) {
          console.error('API Response Error:', error.response.data);
          throw new Error(
            `Tag generation service error: ${error.response.data?.error?.message || 'Unknown error'}`,
          );
        }
        throw new Error('Failed to generate tags. Please try again later.');
      }
    }

    try {
      // Ensure we have a response
      if (!aiResponse) {
        throw new Error('No response received from AI service');
      }

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
