'use client';

import { useState, useEffect, useRef } from 'react';
import { useCategories } from '@/hooks/use-categories';
import { useTags } from '@/hooks/use-tags';
import { useUploadImage } from '@/hooks/use-media';
import { RichTextEditor } from './rich-text-editor';
import { ArticleStatus } from '@/types';
import type { Article, CreateBilingualArticleDto, UpdateBilingualArticleDto } from '@/types';
import { AiFillStar, AiOutlineComment, AiOutlinePushpin } from 'react-icons/ai';

interface ArticleFormProps {
  article?: Article;
  onSubmit: (data: CreateBilingualArticleDto | UpdateBilingualArticleDto) => void;
  isLoading?: boolean;
}

type LanguageTab = 'kz' | 'ru';

export function ArticleForm({ article, onSubmit, isLoading }: ArticleFormProps) {
  const [activeTab, setActiveTab] = useState<LanguageTab>('kz');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [uploadError, setUploadError] = useState('');

  // Status and flags
  const [status, setStatus] = useState<ArticleStatus>(article?.status || ArticleStatus.PUBLISHED);
  const [isBreaking, setIsBreaking] = useState(article?.isBreaking || false);
  const [isFeatured, setIsFeatured] = useState(article?.isFeatured || false);
  const [isPinned, setIsPinned] = useState(article?.isPinned || false);
  const [allowComments, setAllowComments] = useState(article?.allowComments !== false);

  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const uploadImage = useUploadImage();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Пожалуйста, выберите файл изображения');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Размер файла не должен превышать 5MB');
      return;
    }

    setUploadError('');

    try {
      const response = await uploadImage.mutateAsync(file);
      setCoverImage(response.data.url);
    } catch (error) {
      setUploadError('Ошибка при загрузке изображения. Попробуйте еще раз.');
      console.error('Upload error:', error);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setCoverImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      <div className={`space-y-6 ${activeTab !== 'kz' ? 'hidden' : ''}`}>
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
          <RichTextEditor
            content={contentKz}
            onChange={setContentKz}
            placeholder="Мақала мазмұны... (Вы можете загружать изображения перетягиванием или через кнопку в панели инструментов)"
          />
        </div>
      </div>

      {/* Russian Content */}
      <div className={`space-y-6 ${activeTab !== 'ru' ? 'hidden' : ''}`}>
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
          <RichTextEditor
            content={contentRu}
            onChange={setContentRu}
            placeholder="Содержание статьи... (Вы можете загружать изображения перетягиванием или через кнопку в панели инструментов)"
          />
        </div>
      </div>

      {/* Common Fields */}
      <div className="pt-6 border-t border-gray-200 space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Общие настройки</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Изображение обложки
          </label>

          {/* Image Preview */}
          {coverImage && (
            <div className="mb-4 relative">
              <img
                src={coverImage}
                alt="Preview"
                className="max-w-md w-full h-48 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg"
                title="Удалить изображение"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {uploadError}
            </div>
          )}

          {/* File Upload Button */}
          <div className="flex gap-3 mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleBrowseClick}
              disabled={uploadImage.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploadImage.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Загрузка...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Загрузить файл
                </>
              )}
            </button>
          </div>

          {/* URL Input */}
          <div className="text-sm text-gray-500 mb-2">или укажите URL изображения:</div>
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="https://example.com/image.jpg"
          />
          <p className="mt-1 text-xs text-gray-500">
            Максимальный размер файла: 5MB. Поддерживаемые форматы: JPG, PNG, GIF, WebP
          </p>
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
            <label htmlFor="isFeatured" className="ml-2 flex items-center gap-1.5 text-sm text-gray-900">
              <AiFillStar className="text-yellow-500" />
              Избранное (Featured)
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
            <label htmlFor="isPinned" className="ml-2 flex items-center gap-1.5 text-sm text-gray-900">
              <AiOutlinePushpin className="text-blue-600" />
              Закрепленная статья
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
            <label htmlFor="allowComments" className="ml-2 flex items-center gap-1.5 text-sm text-gray-900">
              <AiOutlineComment className="text-green-600" />
              Разрешить комментарии
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
