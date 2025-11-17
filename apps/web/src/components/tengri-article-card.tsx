'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { kk, ru } from 'date-fns/locale';

interface Article {
  id: string;
  slugKz: string;
  slugRu?: string | null;
  titleKz: string;
  titleRu?: string | null;
  excerptKz?: string | null;
  excerptRu?: string | null;
  coverImage?: string | null;
  publishedAt?: Date | null;
  views?: number;
  isBreaking?: boolean;
  isFeatured?: boolean;
  category?: {
    slug: string;
    nameKz: string;
    nameRu: string;
  };
  author?: {
    firstName: string;
    lastName: string;
  };
}

interface TengriArticleCardProps {
  article: Article;
  lang?: 'kz' | 'ru';
  variant?: 'horizontal' | 'vertical' | 'hero';
}

export function TengriArticleCard({
  article,
  lang = 'kz',
  variant = 'horizontal',
}: TengriArticleCardProps) {
  const slug = lang === 'kz' ? article.slugKz : article.slugRu || article.slugKz;
  const title = lang === 'kz' ? article.titleKz : article.titleRu || article.titleKz;
  const excerpt = lang === 'kz' ? article.excerptKz : article.excerptRu || article.excerptKz;
  const categoryName = article.category
    ? lang === 'kz'
      ? article.category.nameKz
      : article.category.nameRu
    : '';

  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), {
        addSuffix: true,
        locale: lang === 'kz' ? kk : ru,
      })
    : '';

  // Category colors (Tengrinews style)
  const getCategoryColor = (categorySlug?: string) => {
    const colors: Record<string, string> = {
      zhanalyqtar: 'bg-blue-600',
      ozekti: 'bg-red-600',
      sayasat: 'bg-purple-600',
      madeniyet: 'bg-pink-600',
      qogam: 'bg-green-600',
      kazakhmys: 'bg-orange-600',
    };
    return colors[categorySlug || ''] || 'bg-gray-600';
  };

  if (variant === 'hero') {
    return (
      <Link
        href={`/${lang}/${article.category?.slug}/${slug}`}
        className="group block relative overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-xl transition-shadow"
      >
        <div className="relative h-[500px]">
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-4xl">📰</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              {article.isBreaking && (
                <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase rounded">
                  {lang === 'kz' ? 'Жедел' : 'Срочно'}
                </span>
              )}
              {article.category && (
                <span
                  className={`px-3 py-1 ${getCategoryColor(
                    article.category.slug
                  )} text-white text-xs font-bold uppercase rounded`}
                >
                  {categoryName}
                </span>
              )}
            </div>
            <h2 className="text-4xl font-bold mb-3 group-hover:text-green-400 transition">
              {title}
            </h2>
            {excerpt && (
              <p className="text-lg text-gray-200 mb-4 line-clamp-2">{excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span>{timeAgo}</span>
              {article.views && (
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {article.views.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'vertical') {
    return (
      <Link
        href={`/${lang}/${article.category?.slug}/${slug}`}
        className="group block bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow border"
      >
        <div className="relative h-48">
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-4xl">📰</span>
            </div>
          )}
          {article.isBreaking && (
            <span className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs font-bold uppercase rounded">
              {lang === 'kz' ? 'Жедел' : 'Срочно'}
            </span>
          )}
        </div>
        <div className="p-4">
          {article.category && (
            <span
              className={`inline-block px-2 py-1 ${getCategoryColor(
                article.category.slug
              )} text-white text-xs font-bold uppercase rounded mb-2`}
            >
              {categoryName}
            </span>
          )}
          <h3 className="font-bold text-lg mb-2 group-hover:text-green-600 transition line-clamp-3">
            {title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{timeAgo}</span>
            {article.views && (
              <span className="flex items-center gap-1">
                👁️ {article.views.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Horizontal (default - Tengrinews style)
  return (
    <Link
      href={`/${lang}/${article.category?.slug}/${slug}`}
      className="group flex gap-4 bg-white hover:bg-gray-50 transition-colors border-b pb-4"
    >
      {/* Image */}
      <div className="relative w-32 h-24 flex-shrink-0 rounded overflow-hidden">
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-2xl">📰</span>
          </div>
        )}
        {article.isBreaking && (
          <span className="absolute top-1 left-1 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold uppercase rounded">
            {lang === 'kz' ? 'Жедел' : 'Срочно'}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {article.category && (
            <span
              className={`px-2 py-0.5 ${getCategoryColor(
                article.category.slug
              )} text-white text-[10px] font-bold uppercase rounded`}
            >
              {categoryName}
            </span>
          )}
          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>
        <h3 className="font-bold text-base mb-1 group-hover:text-green-600 transition line-clamp-2">
          {title}
        </h3>
        {excerpt && (
          <p className="text-sm text-gray-600 line-clamp-2">{excerpt}</p>
        )}
        {article.views && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            👁️ {article.views.toLocaleString()}
          </div>
        )}
      </div>
    </Link>
  );
}
