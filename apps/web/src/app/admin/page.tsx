'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useArticles } from '@/hooks/use-articles';
import { useCategories } from '@/hooks/use-categories';
import { useTags } from '@/hooks/use-tags';

export default function AdminPage() {
  const { user } = useAuth();
  const { data: articles } = useArticles();
  const { data: categories } = useCategories();
  const { data: tags } = useTags();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Панель редактора</h1>
        <p className="text-gray-600">
          Добро пожаловать, {user.firstName} {user.lastName}!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Статьи</h3>
          <p className="text-3xl font-bold text-blue-600">
            {articles?.length || 0}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Категории</h3>
          <p className="text-3xl font-bold text-green-600">
            {categories?.length || 0}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Теги</h3>
          <p className="text-3xl font-bold text-purple-600">
            {tags?.length || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/articles"
          className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-bold mb-2">Управление статьями</h3>
          <p className="text-gray-600">
            Создавайте, редактируйте и публикуйте статьи
          </p>
        </Link>

        {user.role === 'ADMIN' && (
          <>
            <Link
              href="/admin/categories"
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold mb-2">Управление категориями</h3>
              <p className="text-gray-600">
                Добавляйте и редактируйте категории
              </p>
            </Link>

            <Link
              href="/admin/tags"
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold mb-2">Управление тегами</h3>
              <p className="text-gray-600">
                Добавляйте и редактируйте теги
              </p>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
