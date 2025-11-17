'use client';

import { useState } from 'react';
import { useTags, useCreateTag, useDeleteTag } from '@/hooks/use-tags';

export default function AdminTagsPage() {
  const { data: tags, isLoading } = useTags();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();

  const [showForm, setShowForm] = useState(false);
  const [nameKz, setNameKz] = useState('');
  const [nameRu, setNameRu] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTag.mutate(
      { nameKz, nameRu },
      {
        onSuccess: () => {
          setNameKz('');
          setNameRu('');
          setShowForm(false);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот тег?')) {
      deleteTag.mutate(id);
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
        <h1 className="text-4xl font-bold">Управление тегами</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Отмена' : 'Добавить тег'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Новый тег (Билингвальный)</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {createTag.isError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                Ошибка при создании тега. Возможно, тег с таким именем уже существует.
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
                  onChange={(e) => setNameKz(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Мысалы: Саясат"
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
                  placeholder="Например: Политика"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createTag.isPending}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {createTag.isPending ? 'Создание...' : 'Создать'}
            </button>
          </form>
        </div>
      )}

      {tags && tags.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Тегов пока нет</p>
        </div>
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-white shadow-md rounded-lg px-4 py-3 border hover:shadow-lg transition-shadow flex items-center gap-3"
            >
              <div>
                <div className="flex flex-col">
                  <span className="font-semibold">{tag.nameKz}</span>
                  <span className="text-xs text-gray-500">{tag.nameRu}</span>
                </div>
                <span className="text-xs text-gray-500 ml-2">
                  ({(tag as any)._count?.articles || 0} статей)
                </span>
              </div>
              <button
                onClick={() => handleDelete(tag.id)}
                className="text-red-600 hover:text-red-800 text-sm font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
