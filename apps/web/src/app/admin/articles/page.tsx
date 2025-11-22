'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useArticles, useDeleteArticle, useDeleteManyArticles, useCategorizeAllArticles } from '@/hooks/use-articles';
import { useCategories } from '@/hooks/use-categories';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

type SortField = 'title' | 'date' | 'category' | 'status';
type SortOrder = 'asc' | 'desc';

export default function AdminArticlesPage() {
  const { data: articles, isLoading } = useArticles();
  const { data: categories } = useCategories();
  const { user } = useAuth();
  const deleteArticle = useDeleteArticle();
  const deleteManyArticles = useDeleteManyArticles();
  const categorizeAllArticles = useCategorizeAllArticles();

  // Фильтры и сортировка
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Состояние для выбранных статей
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту статью?')) {
      deleteArticle.mutate(id);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedArticles.size === 0) return;

    if (confirm(`Вы уверены, что хотите удалить выбранные статьи (${selectedArticles.size})?`)) {
      deleteManyArticles.mutate(Array.from(selectedArticles), {
        onSuccess: () => {
          setSelectedArticles(new Set());
        },
      });
    }
  };

  const handleCategorizeAll = async () => {
    if (confirm('Вы уверены, что хотите автоматически распределить все статьи по категориям с помощью AI?\n\nЭто может занять несколько минут.')) {
      categorizeAllArticles.mutate(undefined, {
        onSuccess: (response) => {
          alert(
            `Категоризация завершена!\n\n` +
            `Всего статей: ${response.data.stats.total}\n` +
            `Обновлено: ${response.data.stats.updated}\n` +
            `Пропущено: ${response.data.stats.skipped}\n` +
            `Ошибок: ${response.data.stats.errors}`
          );
        },
        onError: (error: any) => {
          alert(`Ошибка категоризации: ${error.response?.data?.message || error.message}`);
        },
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredAndSortedArticles.map(article => article.id));
      setSelectedArticles(allIds);
    } else {
      setSelectedArticles(new Set());
    }
  };

  const handleSelectArticle = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedArticles);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedArticles(newSelected);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Фильтрация и сортировка
  const filteredAndSortedArticles = useMemo(() => {
    if (!articles) return [];

    let filtered = [...articles];

    // Поиск по названию
    if (searchQuery) {
      filtered = filtered.filter((article) =>
        article.titleKz.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.titleRu && article.titleRu.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Фильтр по категории
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((article) => article.category.id === categoryFilter);
    }

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      const isPublished = statusFilter === 'published';
      filtered = filtered.filter((article) => article.published === isPublished);
    }

    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.titleKz.localeCompare(b.titleKz);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'category':
          comparison = a.category.nameKz.localeCompare(b.category.nameKz);
          break;
        case 'status':
          comparison = (a.published ? 1 : 0) - (b.published ? 1 : 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [articles, searchQuery, categoryFilter, statusFilter, sortField, sortOrder]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center">Загрузка...</p>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Управление статьями</h1>
        <div className="flex gap-2">
          {user?.role === 'ADMIN' && (
            <button
              onClick={handleCategorizeAll}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={categorizeAllArticles.isPending || !articles || articles.length === 0}
              title="Распределить все статьи по категориям с помощью AI"
            >
              {categorizeAllArticles.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Категоризация...
                </span>
              ) : (
                '🤖 Категоризовать статьи'
              )}
            </button>
          )}
          {selectedArticles.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              disabled={deleteManyArticles.isPending}
            >
              {deleteManyArticles.isPending
                ? 'Удаление...'
                : `Удалить выбранные (${selectedArticles.size})`}
            </button>
          )}
          <Link
            href="/admin/articles/new"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Создать статью
          </Link>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Поиск */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Поиск
            </label>
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Категория */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Категория
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все категории</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameKz}
                </option>
              ))}
            </select>
          </div>

          {/* Статус */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все статусы</option>
              <option value="published">Опубликовано</option>
              <option value="draft">Черновик</option>
            </select>
          </div>

          {/* Сброс фильтров */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setStatusFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>

        {/* Счетчик */}
        <div className="mt-4 text-sm text-gray-600">
          Показано: {filteredAndSortedArticles.length} из {articles?.length || 0} статей
        </div>
      </div>

      {filteredAndSortedArticles.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">
            {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Статьи не найдены по заданным фильтрам'
              : 'Статей пока нет'}
          </p>
        </div>
      )}

      {filteredAndSortedArticles.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedArticles.size === filteredAndSortedArticles.length && filteredAndSortedArticles.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  №
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('title')}
                >
                  Название <SortIcon field="title" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Автор
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}
                >
                  Категория <SortIcon field="category" />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Статус <SortIcon field="status" />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  Дата <SortIcon field="date" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedArticles.map((article, index) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedArticles.has(article.id)}
                      onChange={(e) => handleSelectArticle(article.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-md truncate">
                      {article.titleKz.length > 80
                        ? article.titleKz.substring(0, 80) + '...'
                        : article.titleKz}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {article.author.firstName} {article.author.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {article.category.nameKz}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        article.published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {article.published ? 'Опубликовано' : 'Черновик'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(article.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Редактировать
                    </Link>
                    {(user?.role === 'ADMIN' || article.author.id === user?.id) && (
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
