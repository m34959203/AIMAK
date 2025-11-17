'use client';

import Link from 'next/link';
import { useCategories } from '@/hooks/use-categories';

export default function CategoriesPage() {
  const { data: categories, isLoading, error } = useCategories();
  const lang = 'kz'; // Default language for legacy route

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Категории</h1>
        <p className="text-gray-600">
          Просматривайте статьи по категориям
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Загрузка категорий...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-600">Ошибка при загрузке категорий</p>
        </div>
      )}

      {categories && categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Категорий пока нет</p>
        </div>
      )}

      {categories && categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const categoryName = lang === 'kz' ? category.nameKz : category.nameRu;
            const categoryDescription = lang === 'kz' ? category.descriptionKz : category.descriptionRu;

            return (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold mb-2">{categoryName}</h3>
                {categoryDescription && (
                  <p className="text-gray-600 mb-4">{categoryDescription}</p>
                )}
                <div className="text-sm text-gray-500">
                  {(category as any)._count?.articles || 0} статей
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
