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

    // Validate response
    const suggestedSlug = aiResponse.toLowerCase().trim();
    const validSlugs = categories.map(c => c.slug);

    if (validSlugs.includes(suggestedSlug)) {
      return suggestedSlug;
    }

    console.error(`AI returned invalid category slug: "${suggestedSlug}"`);
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
    return `Ты - эксперт по категоризации новостных статей. Проанализируй следующую статью и определи наиболее подходящую категорию.

СТАТЬЯ:
Заголовок: ${article.titleKz}
${article.excerptKz ? `Краткое описание: ${article.excerptKz}` : ''}
Содержание: ${article.contentKz.substring(0, 2000)}${article.contentKz.length > 2000 ? '...' : ''}

ДОСТУПНЫЕ КАТЕГОРИИ:
${categoriesDesc}

ИНСТРУКЦИИ:
1. Внимательно прочитай статью
2. Определи её основную тему
3. Выбери ОДНУ наиболее подходящую категорию из списка выше
4. Верни ТОЛЬКО slug категории (например: "zhanalyqtar", "ozekti", "sayasat", "madeniyet", "qogam", "kazakhmys")
5. Если статья про компанию Kazakhmys или горнодобывающую промышленность, выбери "kazakhmys"
6. Если статья про политику или правительство, выбери "sayasat"
7. Если статья про культуру, искусство, литературу, выбери "madeniyet"
8. Если статья про социальные вопросы, общество, выбери "qogam"
9. Если статья актуальна или важна, но не подходит к специфичным категориям, выбери "ozekti"
10. Для обычных новостей выбери "zhanalyqtar"

Верни ТОЛЬКО slug категории без дополнительного текста.`;
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
        temperature: 0.3,
        maxOutputTokens: 50,
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
   * Категоризация через OpenRouter
   */
  private async categorizeWithOpenRouter(prompt: string): Promise<string | null> {
    if (!this.openRouterKey) {
      return null;
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 50,
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
  }
}
