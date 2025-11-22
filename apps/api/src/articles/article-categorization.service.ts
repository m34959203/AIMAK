import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

/**
 * Сервис для автоматической категоризации статей с использованием AI
 */
@Injectable()
export class ArticleCategorizationService {
  private geminiClient: GoogleGenerativeAI | null = null;
  private openRouterKey: string | null = null;

  constructor() {
    // Initialize Google Gemini client if API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiApiKey);
    }

    // Initialize OpenRouter key
    this.openRouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || null;
  }

  /**
   * Определить категорию для статьи на основе её содержимого
   */
  async categorizeArticle(
    article: { titleKz: string; contentKz: string; excerptKz?: string | null },
    categories: Array<{
      slug: string;
      nameKz: string;
      nameRu: string;
      descriptionKz: string | null;
      descriptionRu: string | null;
    }>
  ): Promise<string | null> {
    if (!this.geminiClient && !this.openRouterKey) {
      throw new BadRequestException(
        'AI categorization is not configured. Please set GEMINI_API_KEY or OPENROUTER_API_KEY environment variable.'
      );
    }

    const categoriesDesc = this.getCategoriesDescription(categories);
    const prompt = this.buildPrompt(article, categoriesDesc);
    const validSlugs = categories.map(c => c.slug);

    let aiResponse: string | null = null;

    // Try Gemini first
    if (this.geminiClient) {
      try {
        aiResponse = await this.categorizeWithGemini(prompt);
      } catch (error) {
        console.error('Gemini categorization error:', error instanceof Error ? error.message : String(error));
      }
    }

    // Fallback to OpenRouter
    if (!aiResponse && this.openRouterKey) {
      try {
        aiResponse = await this.categorizeWithOpenRouter(prompt);
      } catch (error) {
        console.error('OpenRouter categorization error:', error instanceof Error ? error.message : String(error));
      }
    }

    if (!aiResponse) {
      return null;
    }

    // Extract and validate slug from response
    const suggestedSlug = this.extractSlugFromResponse(aiResponse, validSlugs);

    if (suggestedSlug) {
      return suggestedSlug;
    }

    console.error(`AI returned invalid category slug. Response: "${aiResponse.substring(0, 100)}"`);
    return null;
  }

  /**
   * Извлечь slug категории из ответа AI
   */
  private extractSlugFromResponse(response: string, validSlugs: string[]): string | null {
    const cleaned = response.toLowerCase().trim();

    // Проверяем, является ли весь ответ валидным slug
    if (validSlugs.includes(cleaned)) {
      return cleaned;
    }

    // Пробуем найти валидный slug в ответе
    for (const slug of validSlugs) {
      if (cleaned.includes(slug)) {
        return slug;
      }
    }

    // Пробуем взять первое слово
    const firstWord = cleaned.split(/\s+/)[0].replace(/[^a-z]/g, '');
    if (validSlugs.includes(firstWord)) {
      return firstWord;
    }

    return null;
  }

  /**
   * Описание категорий для AI
   */
  private getCategoriesDescription(
    categories: Array<{
      slug: string;
      nameKz: string;
      nameRu: string;
      descriptionKz: string | null;
      descriptionRu: string | null;
    }>
  ): string {
    return categories
      .map(cat => {
        return `- ${cat.slug} (${cat.nameKz} / ${cat.nameRu}): ${cat.descriptionRu || cat.descriptionKz || 'Без описания'}`;
      })
      .join('\n');
  }

  /**
   * Построить промпт для AI
   */
  private buildPrompt(
    article: { titleKz: string; contentKz: string; excerptKz?: string | null },
    categoriesDesc: string
  ): string {
    return `Categorize this article. Respond with ONLY ONE WORD - the category slug.

ARTICLE:
Title: ${article.titleKz}
${article.excerptKz ? `Excerpt: ${article.excerptKz}` : ''}
Content: ${article.contentKz.substring(0, 1500)}${article.contentKz.length > 1500 ? '...' : ''}

AVAILABLE CATEGORIES:
${categoriesDesc}

RULES:
- kazakhmys: Kazakhmys company or mining industry news
- sayasat: Politics, government, policy
- madeniyet: Culture, art, literature
- qogam: Society, social issues
- ozekti: Important/urgent news that doesn't fit other categories
- zhanalyqtar: General news

RESPOND WITH ONLY THE SLUG (one word), nothing else. Example: zhanalyqtar`;
  }

  /**
   * Категоризация через Google Gemini
   */
  private async categorizeWithGemini(prompt: string): Promise<string | null> {
    if (!this.geminiClient) {
      return null;
    }

    const model = this.geminiClient.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 10,
      },
    });

    const result = await model.generateContent(prompt);

    if (result.response.promptFeedback?.blockReason) {
      throw new Error(`Content blocked: ${result.response.promptFeedback.blockReason}`);
    }

    const candidates = result.response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No response candidates from Gemini');
    }

    return result.response.text().trim();
  }

  /**
   * Категоризация через OpenRouter (с retry для rate limit)
   */
  private async categorizeWithOpenRouter(prompt: string, retries = 2): Promise<string | null> {
    if (!this.openRouterKey) {
      return null;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free',
            messages: [
              {
                role: 'system',
                content: 'You are a categorization bot. Respond with ONLY ONE WORD - the category slug. No explanations.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.1,
            max_tokens: 10,
          },
          {
            headers: {
              Authorization: `Bearer ${this.openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
              'X-Title': 'AIMAK News',
            },
          }
        );

        if (!response.data?.choices || response.data.choices.length === 0) {
          throw new Error('Invalid response from OpenRouter: no choices');
        }

        const choice = response.data.choices[0];
        const messageContent = choice?.message?.content || choice?.message?.reasoning || '';

        if (!messageContent || messageContent.trim().length === 0) {
          throw new Error('Empty response from OpenRouter');
        }

        return messageContent.trim();
      } catch (error) {
        // Если rate limit и есть еще попытки, ждем и пробуем снова
        if (axios.isAxiosError(error) && error.response?.status === 429 && attempt < retries) {
          const delay = (attempt + 1) * 2000; // 2s, 4s
          console.log(`Rate limit hit, waiting ${delay}ms before retry ${attempt + 1}/${retries}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }

    throw new Error('Failed after retries');
  }
}
