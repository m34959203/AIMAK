import { Injectable, BadRequestException } from '@nestjs/common';
import { TranslateDto, TranslateArticleDto, TranslationLanguage } from './dto/translate.dto';
import axios from 'axios';

@Injectable()
export class TranslationService {
  /**
   * Translate a single text from one language to another
   */
  async translateText(dto: TranslateDto): Promise<{ translatedText: string }> {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new BadRequestException(
        'Translation service is not configured. Please contact the administrator.',
      );
    }

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
          temperature: 0.3, // Lower temperature for more consistent translations
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
            'X-Title': 'AIMAK News Translation',
          },
        },
      );

      const translatedText = response.data.choices[0].message.content.trim();

      return { translatedText };
    } catch (error) {
      console.error('Translation error:', error);

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

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('Translation API key not configured');
      throw new BadRequestException(
        'Translation service is not configured. Please contact the administrator.',
      );
    }

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

    try {
      console.log('Sending request to OpenRouter API...');
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
            'X-Title': 'AIMAK News Translation',
          },
        },
      );

      console.log('OpenRouter API response received');
      const aiResponse = response.data.choices[0].message.content;

      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to extract JSON from response:', aiResponse);
        throw new Error('Failed to parse translation response');
      }

      const translation = JSON.parse(jsonMatch[0]);
      console.log('Translation completed successfully');

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
