import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { ArticleCategorizationService } from './article-categorization.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(
    private articlesService: ArticlesService,
    private categorizationService: ArticleCategorizationService,
    private prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create article (Editor/Admin only)' })
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: any) {
    return this.articlesService.create(dto, user.id);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all articles with optional pagination' })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  @ApiQuery({ name: 'isBreaking', required: false, type: Boolean })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiQuery({ name: 'isPinned', required: false, type: Boolean })
  @ApiQuery({ name: 'categorySlug', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  findAll(
    @Query('published') published?: string,
    @Query('isBreaking') isBreaking?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('isPinned') isPinned?: string,
    @Query('categorySlug') categorySlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const publishedFilter = published === 'true' ? true : published === 'false' ? false : undefined;
    const isBreakingFilter = isBreaking === 'true' ? true : isBreaking === 'false' ? false : undefined;
    const isFeaturedFilter = isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined;
    const isPinnedFilter = isPinned === 'true' ? true : isPinned === 'false' ? false : undefined;
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;

    return this.articlesService.findAll({
      published: publishedFilter,
      isBreaking: isBreakingFilter,
      isFeatured: isFeaturedFilter,
      isPinned: isPinnedFilter,
      categorySlug,
      page: pageNumber,
      limit: limitNumber,
    });
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get article by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get article by id' })
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update article (Editor/Admin only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: any,
  ) {
    return this.articlesService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete article (Editor/Admin only)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.articlesService.remove(id, user.id, user.role);
  }

  @Post('delete-many')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete multiple articles (Editor/Admin only)' })
  removeMany(@Body() body: { ids: string[] }, @CurrentUser() user: any) {
    return this.articlesService.removeMany(body.ids, user.id, user.role);
  }

  @Post('analyze')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyze article with AI editor (Editor/Admin only)' })
  analyzeArticle(@Body() dto: AnalyzeArticleDto) {
    return this.articlesService.analyzeArticle(dto);
  }

  @Post('categorize-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Categorize all articles using AI (Admin only)' })
  async categorizeAllArticles() {
    const categories = await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    if (categories.length === 0) {
      return {
        success: false,
        message: 'No categories found',
      };
    }

    const articles = await this.prisma.article.findMany({
      select: {
        id: true,
        titleKz: true,
        contentKz: true,
        excerptKz: true,
        categoryId: true,
        category: {
          select: {
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (articles.length === 0) {
      return {
        success: true,
        message: 'No articles to categorize',
        stats: {
          total: 0,
          updated: 0,
          skipped: 0,
          errors: 0,
        },
      };
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const article of articles) {
      try {
        const suggestedSlug = await this.categorizationService.categorizeArticle(
          {
            titleKz: article.titleKz,
            contentKz: article.contentKz,
            excerptKz: article.excerptKz,
          },
          categories
        );

        if (!suggestedSlug) {
          skipped++;
          continue;
        }

        const suggestedCategory = categories.find(c => c.slug === suggestedSlug);

        if (!suggestedCategory) {
          skipped++;
          continue;
        }

        // Only update if category changed
        if (article.category?.slug !== suggestedSlug) {
          await this.prisma.article.update({
            where: { id: article.id },
            data: { categoryId: suggestedCategory.id },
          });
          updated++;
        } else {
          skipped++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error categorizing article ${article.id}:`, error);
        errors++;
      }
    }

    return {
      success: true,
      message: 'Categorization completed',
      stats: {
        total: articles.length,
        updated,
        skipped,
        errors,
      },
    };
  }
}
