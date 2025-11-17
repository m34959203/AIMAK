'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useArticles } from '@/hooks/use-articles';
import { ArticleCard } from '@/components/article-card';
import { useMemo } from 'react';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { data: articles, isLoading } = useArticles(true);

  const filteredArticles = useMemo(() => {
    if (!articles || !query) return [];

    const lowerQuery = query.toLowerCase();
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(lowerQuery) ||
        article.content.toLowerCase().includes(lowerQuery) ||
        article.excerpt?.toLowerCase().includes(lowerQuery) ||
        article.category.name.toLowerCase().includes(lowerQuery) ||
        article.tags.some((tag) => tag.name.toLowerCase().includes(lowerQuery))
    );
  }, [articles, query]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">
          Результаты поиска: "{query}"
        </h1>
        <p className="text-gray-600">
          Найдено статей: {filteredArticles.length}
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Поиск...</p>
        </div>
      )}

      {!isLoading && filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            По вашему запросу ничего не найдено. Попробуйте изменить поисковый запрос.
          </p>
        </div>
      )}

      {filteredArticles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
