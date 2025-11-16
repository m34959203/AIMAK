'use client';

import { useParams } from 'next/navigation';
import { useArticleBySlug } from '@/hooks/use-articles';
import { formatDate } from '@/lib/utils';

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: article, isLoading, error } = useArticleBySlug(slug);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-red-600">Статья не найдена</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-4xl mx-auto">
        {article.coverImage && (
          <div className="aspect-video mb-8 rounded-lg overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded">
              {article.category.name}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">
              {formatDate(article.publishedAt || article.createdAt)}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">{article.views} просмотров</span>
          </div>

          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

          <div className="flex items-center gap-4 text-gray-600">
            <span>
              Автор: {article.author.firstName} {article.author.lastName}
            </span>
          </div>
        </div>

        <div className="prose max-w-none mb-8">
          <div className="whitespace-pre-wrap">{article.content}</div>
        </div>

        {article.tags.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold mb-3">Теги:</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-sm bg-gray-100 px-3 py-1 rounded"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
