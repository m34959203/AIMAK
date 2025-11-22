import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { ArticleCategorizationService } from './article-categorization.service';
import { TranslationModule } from '../translation/translation.module';

@Module({
  imports: [TranslationModule],
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticleCategorizationService],
  exports: [ArticlesService, ArticleCategorizationService],
})
export class ArticlesModule {}
