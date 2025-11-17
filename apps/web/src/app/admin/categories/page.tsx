'use client';

import { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/use-categories';

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [nameKz, setNameKz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [descriptionKz, setDescriptionKz] = useState('');
  const [descriptionRu, setDescriptionRu] = useState('');
  const [slug, setSlug] = useState('');

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-zа-яәіңғүұқөһ0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameKzChange = (value: string) => {
    setNameKz(value);
    if (!slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCategory.mutate(
      {
        slug: slug || generateSlug(nameKz),
        nameKz,
        nameRu,
        descriptionKz: descriptionKz || undefined,
        descriptionRu: descriptionRu || undefined,
      },
      {
        onSuccess: () => {
          setNameKz('');
          setNameRu('');
          setDescriptionKz('');
          setDescriptionRu('');
          setSlug('');
          setShowForm(false);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту категорию?')) {
      deleteCategory.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Управление категориями</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Отмена' : 'Добавить категорию'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Новая категория (Билингвальная)</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {createCategory.isError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                Ошибка при создании категории
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название (Қазақша) *
                </label>
                <input
                  type="text"
                  value={nameKz}
                  onChange={(e) => handleNameKzChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Мысалы: Жаңалықтар"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название (Русский) *
                </label>
                <input
                  type="text"
                  value={nameRu}
                  onChange={(e) => setNameRu(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Например: Новости"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL) *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="zhanalyqtar"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Автоматически генерируется из казахского названия
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание (Қазақша)
              </label>
              <textarea
                value={descriptionKz}
                onChange={(e) => setDescriptionKz(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Санаттың сипаттамасы (міндетті емес)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание (Русский)
              </label>
              <textarea
                value={descriptionRu}
                onChange={(e) => setDescriptionRu(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Описание категории (опционально)"
              />
            </div>

            <button
              type="submit"
              disabled={createCategory.isPending}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {createCategory.isPending ? 'Создание...' : 'Создать'}
            </button>
          </form>
        </div>
      )}

      {categories && categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Категорий пока нет</p>
        </div>
      )}

      {categories && categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white shadow-md rounded-lg p-6 border hover:shadow-lg transition-shadow"
            >
              <div className="mb-2">
                <h3 className="text-xl font-bold">{category.nameKz}</h3>
                <p className="text-sm text-gray-500">{category.nameRu}</p>
              </div>
              {category.descriptionKz && (
                <p className="text-gray-600 mb-2 text-sm">{category.descriptionKz}</p>
              )}
              {category.descriptionRu && (
                <p className="text-gray-500 mb-4 text-xs italic">{category.descriptionRu}</p>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-500">
                  <div>Slug: <span className="font-mono">{category.slug}</span></div>
                  <div>{(category as any)._count?.articles || 0} статей</div>
                </div>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-semibold"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
