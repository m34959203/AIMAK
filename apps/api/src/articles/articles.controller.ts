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
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticlesService) {}

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
  @ApiOperation({ summary: 'Get all articles' })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  @ApiQuery({ name: 'isBreaking', required: false, type: Boolean })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiQuery({ name: 'isPinned', required: false, type: Boolean })
  @ApiQuery({ name: 'categorySlug', required: false, type: String })
  findAll(
    @Query('published') published?: string,
    @Query('isBreaking') isBreaking?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('isPinned') isPinned?: string,
    @Query('categorySlug') categorySlug?: string,
  ) {
    const publishedFilter = published === 'true' ? true : published === 'false' ? false : undefined;
    const isBreakingFilter = isBreaking === 'true' ? true : isBreaking === 'false' ? false : undefined;
    const isFeaturedFilter = isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined;
    const isPinnedFilter = isPinned === 'true' ? true : isPinned === 'false' ? false : undefined;

    return this.articlesService.findAll({
      published: publishedFilter,
      isBreaking: isBreakingFilter,
      isFeatured: isFeaturedFilter,
      isPinned: isPinnedFilter,
      categorySlug,
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

  @Post('analyze')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyze article with AI editor (Editor/Admin only)' })
  analyzeArticle(@Body() dto: AnalyzeArticleDto) {
    return this.articlesService.analyzeArticle(dto);
  }
}
