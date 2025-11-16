'use client';

import { useParams } from 'next/navigation';
import { useCategory } from '@/hooks/use-categories';
import { ArticleCard } from '@/components/article-card';

export default function CategoryPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: category, isLoading, error } = useCategory(id);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-red-600">Категория не найдена</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
        {category.description && (
          <p className="text-lg text-gray-600">{category.description}</p>
        )}
      </div>

      {category.articles && category.articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">В этой категории пока нет статей</p>
        </div>
      )}

      {category.articles && category.articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.articles.map((article) => (
            <ArticleCard key={article.id} article={article as any} />
          ))}
        </div>
      )}
    </div>
  );
}
