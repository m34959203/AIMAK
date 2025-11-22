import { Injectable, BadRequestException } from '@nestjs/common';
import { TranslateDto, TranslateArticleDto, TranslationLanguage } from './dto/translate.dto';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class TranslationService {
  private geminiClient: GoogleGenerativeAI | null = null;

  constructor() {
    // Initialize Google Gemini client if API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiApiKey);
    }
  }
  /**
   * Translate a single text from one language to another
   */
  async translateText(dto: TranslateDto): Promise<{ translatedText: string }> {
    if (dto.sourceLanguage === dto.targetLanguage) {
      throw new BadRequestException('Source and target languages must be different');
    }

    const languageNames = {
      [TranslationLanguage.KAZAKH]: 'Kazakh (Қазақ тілі)',
      [TranslationLanguage.RUSSIAN]: 'Russian (Русский)',
    };

    const prompt = `You are a professional translator specializing in ${languageNames[dto.sourceLanguage]} to ${languageNames[dto.targetLanguage]} translation.

Your task is to translate the following text accurately while preserving:
- The original meaning and tone
- Cultural context and nuances
- HTML tags and formatting (if present)
- Technical terms appropriately

Source language: ${languageNames[dto.sourceLanguage]}
Target language: ${languageNames[dto.targetLanguage]}

Text to translate:
${dto.text}

IMPORTANT: Return ONLY the translated text without any explanations, notes, or additional commentary.`;

    // Try Google Gemini first if available
    if (this.geminiClient) {
      try {
        console.log('Using Google Gemini API for translation...');
        const model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const translatedText = result.response.text().trim();
        console.log('Google Gemini translation successful');
        return { translatedText };
      } catch (error) {
        console.error('Google Gemini translation error:', error);
        // Fall through to OpenRouter
      }
    }

    // Fall back to OpenRouter
    const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!openRouterKey) {
      throw new BadRequestException(
        'Translation service is not configured. Please set GEMINI_API_KEY or OPENROUTER_API_KEY environment variable.',
      );
    }

    try {
      console.log('Using OpenRouter API for translation...');
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
          temperature: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
            'X-Title': 'AIMAK News Translation',
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

      const translatedText = messageContent.trim();
      console.log('OpenRouter translation successful');
      return { translatedText };
    } catch (error) {
      console.error('OpenRouter translation error:', error);

      if (axios.isAxiosError(error) && error.response) {
        console.error('API Response Error:', error.response.data);
        throw new BadRequestException(
          `Translation service error: ${error.response.data?.error?.message || 'Unknown error'}`,
        );
      }

      throw new BadRequestException(
        'Failed to translate text. Please try again later.',
      );
    }
  }

  /**
   * Translate an entire article (title, excerpt, content)
   */
  async translateArticle(dto: TranslateArticleDto): Promise<{
    title: string;
    excerpt?: string;
    content: string;
  }> {
    console.log('Translation request received:', {
      titleLength: dto.title?.length,
      contentLength: dto.content?.length,
      excerptLength: dto.excerpt?.length,
      sourceLanguage: dto.sourceLanguage,
      targetLanguage: dto.targetLanguage,
    });

    if (dto.sourceLanguage === dto.targetLanguage) {
      throw new BadRequestException('Source and target languages must be different');
    }

    // Validate input data
    if (!dto.title || !dto.content) {
      throw new BadRequestException('Title and content are required for translation');
    }

    const languageNames = {
      [TranslationLanguage.KAZAKH]: 'Kazakh (Қазақ тілі)',
      [TranslationLanguage.RUSSIAN]: 'Russian (Русский)',
    };

    const prompt = `You are a professional news translator specializing in ${languageNames[dto.sourceLanguage]} to ${languageNames[dto.targetLanguage]} translation for a bilingual news website.

Your task is to translate ALL parts of the following news article accurately while preserving:
- Journalistic tone and style
- Cultural context and nuances
- HTML tags and formatting (if present)
- Proper names (people, places, organizations)
- Numbers, dates, and statistics

Source language: ${languageNames[dto.sourceLanguage]}
Target language: ${languageNames[dto.targetLanguage]}

ARTICLE TO TRANSLATE:

Title: ${dto.title}

${dto.excerpt ? `Excerpt: ${dto.excerpt}` : ''}

Content: ${dto.content}

Return your translation as a JSON object with this EXACT structure:
{
  "title": "Translated title",
  ${dto.excerpt ? '"excerpt": "Translated excerpt",' : ''}
  "content": "Translated content"
}

IMPORTANT: Return ONLY the JSON object, no additional text or explanations.`;

    // Try Google Gemini first if available
    if (this.geminiClient) {
      try {
        console.log('Using Google Gemini API for article translation...');
        const model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        // Extract JSON from the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('Failed to extract JSON from Gemini response:', aiResponse);
          throw new Error('Failed to parse translation response');
        }

        const translation = JSON.parse(jsonMatch[0]);
        console.log('Google Gemini article translation successful');

        return {
          title: translation.title,
          excerpt: dto.excerpt ? translation.excerpt : undefined,
          content: translation.content,
        };
      } catch (error) {
        console.error('Google Gemini article translation error:', error);
        // Fall through to OpenRouter
      }
    }

    // Fall back to OpenRouter
    const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!openRouterKey) {
      throw new BadRequestException(
        'Translation service is not configured. Please set GEMINI_API_KEY or OPENROUTER_API_KEY environment variable.',
      );
    }

    try {
      console.log('Using OpenRouter API for article translation...');
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
            'X-Title': 'AIMAK News Translation',
          },
        },
      );

      console.log('OpenRouter API response received');

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

      const aiResponse = messageContent;

      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to extract JSON from response:', aiResponse);
        throw new Error('Failed to parse translation response');
      }

      const translation = JSON.parse(jsonMatch[0]);
      console.log('OpenRouter article translation successful');

      return {
        title: translation.title,
        excerpt: dto.excerpt ? translation.excerpt : undefined,
        content: translation.content,
      };
    } catch (error) {
      console.error('Article translation error:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('API Response Status:', error.response.status);
          console.error('API Response Data:', JSON.stringify(error.response.data, null, 2));
          const errorMessage = error.response.data?.error?.message || error.response.data?.message || 'Unknown error from translation service';
          throw new BadRequestException(
            `Translation service error: ${errorMessage}`,
          );
        } else if (error.request) {
          console.error('No response received from API');
          throw new BadRequestException(
            'Translation service is not responding. Please try again later.',
          );
        }
      }

      if (error instanceof Error && error.message?.includes('Failed to parse')) {
        throw new BadRequestException(
          'Translation returned invalid format. Please try again.',
        );
      }

      throw new BadRequestException(
        'Failed to translate article. Please try again later.',
      );
    }
  }
}
