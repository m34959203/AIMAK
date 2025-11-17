'use client';

import { useState, useEffect } from 'react';
import { useCategories } from '@/hooks/use-categories';
import { useTags } from '@/hooks/use-tags';
import { ArticleStatus } from '@/types';
import type { Article, CreateBilingualArticleDto, UpdateBilingualArticleDto } from '@/types';

interface ArticleFormProps {
  article?: Article;
  onSubmit: (data: CreateBilingualArticleDto | UpdateBilingualArticleDto) => void;
  isLoading?: boolean;
}

type LanguageTab = 'kz' | 'ru';

export function ArticleForm({ article, onSubmit, isLoading }: ArticleFormProps) {
  const [activeTab, setActiveTab] = useState<LanguageTab>('kz');

  // Kazakh content
  const [titleKz, setTitleKz] = useState(article?.titleKz || '');
  const [contentKz, setContentKz] = useState(article?.contentKz || '');
  const [excerptKz, setExcerptKz] = useState(article?.excerptKz || '');

  // Russian content
  const [titleRu, setTitleRu] = useState(article?.titleRu || '');
  const [contentRu, setContentRu] = useState(article?.contentRu || '');
  const [excerptRu, setExcerptRu] = useState(article?.excerptRu || '');

  // Common fields
  const [coverImage, setCoverImage] = useState(article?.coverImage || '');
  const [categoryId, setCategoryId] = useState(article?.category?.id || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    article?.tags?.map((t) => t.id) || []
  );

  // Status and flags
  const [status, setStatus] = useState<ArticleStatus>(article?.status || ArticleStatus.DRAFT);
  const [isBreaking, setIsBreaking] = useState(article?.isBreaking || false);
  const [isFeatured, setIsFeatured] = useState(article?.isFeatured || false);
  const [isPinned, setIsPinned] = useState(article?.isPinned || false);
  const [allowComments, setAllowComments] = useState(article?.allowComments !== false);

  const { data: categories } = useCategories();
  const { data: tags } = useTags();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateBilingualArticleDto | UpdateBilingualArticleDto = {
      // Kazakh content (required)
      titleKz,
      contentKz,
      excerptKz: excerptKz || undefined,

      // Russian content (optional)
      titleRu: titleRu || undefined,
      contentRu: contentRu || undefined,
      excerptRu: excerptRu || undefined,

      // Common fields
      coverImage: coverImage || undefined,
      categoryId,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,

      // Status and flags
      status,
      isBreaking,
      isFeatured,
      isPinned,
      allowComments,
    };

    onSubmit(data);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Language Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('kz')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'kz'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🇰🇿 Қазақша (обязательно)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ru')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ru'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🇷🇺 Русский (опционально)
          </button>
        </nav>
      </div>

      {/* Kazakh Content */}
      {activeTab === 'kz' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заголовок (казахский) *
            </label>
            <input
              type="text"
              value={titleKz}
              onChange={(e) => setTitleKz(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Мақала тақырыбы"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Краткое описание (казахский)
            </label>
            <textarea
              value={excerptKz}
              onChange={(e) => setExcerptKz(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Мақаланың қысқаша сипаттамасы"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Содержание (казахский) *
            </label>
            <textarea
              value={contentKz}
              onChange={(e) => setContentKz(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={15}
              placeholder="Мақала мазмұны"
              required
            />
          </div>
        </div>
      )}

      {/* Russian Content */}
      {activeTab === 'ru' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заголовок (русский)
            </label>
            <input
              type="text"
              value={titleRu}
              onChange={(e) => setTitleRu(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Заголовок статьи"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Краткое описание (русский)
            </label>
            <textarea
              value={excerptRu}
              onChange={(e) => setExcerptRu(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Краткое описание статьи"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Содержание (русский)
            </label>
            <textarea
              value={contentRu}
              onChange={(e) => setContentRu(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={15}
              placeholder="Содержание статьи"
            />
          </div>
        </div>
      )}

      {/* Common Fields */}
      <div className="pt-6 border-t border-gray-200 space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Общие настройки</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL изображения обложки
          </label>
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Категория *
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Выберите категорию</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nameKz} / {category.nameRu}
              </option>
            ))}
          </select>
        </div>

        {tags && tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Теги
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTags.includes(tag.id)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag.nameKz}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус публикации *
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ArticleStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value={ArticleStatus.DRAFT}>Черновик</option>
            <option value={ArticleStatus.REVIEW}>На проверке</option>
            <option value={ArticleStatus.SCHEDULED}>Запланировано</option>
            <option value={ArticleStatus.PUBLISHED}>Опубликовано</option>
            <option value={ArticleStatus.ARCHIVED}>В архиве</option>
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isBreaking"
              checked={isBreaking}
              onChange={(e) => setIsBreaking(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="isBreaking" className="ml-2 block text-sm text-gray-900">
              🚨 Срочная новость (Breaking News)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
              ⭐ Избранное (Featured)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="isPinned" className="ml-2 block text-sm text-gray-900">
              📌 Закрепленная статья
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowComments"
              checked={allowComments}
              onChange={(e) => setAllowComments(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="allowComments" className="ml-2 block text-sm text-gray-900">
              💬 Разрешить комментарии
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Сохранение...' : article ? 'Обновить статью' : 'Создать статью'}
        </button>
      </div>
    </form>
  );
}
