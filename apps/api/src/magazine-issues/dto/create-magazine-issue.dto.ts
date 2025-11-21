import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMagazineIssueDto {
  @ApiProperty({ example: 1, description: 'Номер выпуска' })
  @IsInt()
  @Min(1)
  issueNumber!: number;

  @ApiProperty({ example: '2025-01-15T00:00:00Z', description: 'Дата публикации' })
  @IsDateString()
  publishDate!: string;

  @ApiProperty({ example: 'Қаңтар айының шығарылымы', description: 'Название на казахском' })
  @IsString()
  @IsNotEmpty()
  titleKz!: string;

  @ApiProperty({ example: 'Январский выпуск', description: 'Название на русском' })
  @IsString()
  @IsNotEmpty()
  titleRu!: string;

  @ApiProperty({ example: 120, description: 'Количество страниц', required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  pagesCount?: number;

  @ApiProperty({ example: 'https://example.com/cover.jpg', description: 'URL обложки', required: false })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @ApiProperty({ example: true, description: 'Опубликован', required: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({ example: false, description: 'Закреплен', required: false })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;
}
