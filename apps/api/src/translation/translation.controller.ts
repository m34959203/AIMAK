import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TranslateDto, TranslateArticleDto } from './dto/translate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('translation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post('text')
  @Roles('EDITOR', 'ADMIN')
  async translateText(@Body() translateDto: TranslateDto) {
    return this.translationService.translateText(translateDto);
  }

  @Post('article')
  @Roles('EDITOR', 'ADMIN')
  async translateArticle(@Body() translateArticleDto: TranslateArticleDto) {
    return this.translationService.translateArticle(translateArticleDto);
  }
}
