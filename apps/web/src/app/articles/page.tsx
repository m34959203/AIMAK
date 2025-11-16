'use client';

import { useArticles } from '@/hooks/use-articles';
import { ArticleCard } from '@/components/article-card';

export default function ArticlesPage() {
  const { data: articles, isLoading, error } = useArticles(true);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Все статьи</h1>
        <p className="text-gray-600">
          Читайте последние новости и публикации
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Загрузка статей...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-600">Ошибка при загрузке статей</p>
        </div>
      )}

      {articles && articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Статьи пока не опубликованы</p>
        </div>
      )}

      {articles && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
