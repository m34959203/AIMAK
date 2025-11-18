'use client';

import { useArticles } from '@/hooks/use-articles';

export default function DebugArticlesPage() {
  const { data: allArticles, isLoading: allLoading } = useArticles();
  const { data: publishedArticles, isLoading: publishedLoading } = useArticles(true);

  if (allLoading || publishedLoading) {
    return <div className="p-8">Загрузка...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Диагностика статей</h1>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          Все статьи (всего: {allArticles?.length || 0})
        </h2>
        <div className="bg-white shadow rounded-lg p-4">
          {allArticles && allArticles.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Заголовок (KZ)</th>
                  <th className="text-left p-2">Категория</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Published</th>
                  <th className="text-left p-2">publishedAt</th>
                </tr>
              </thead>
              <tbody>
                {allArticles.map((article: any) => (
                  <tr key={article.id} className="border-b">
                    <td className="p-2">{article.titleKz}</td>
                    <td className="p-2">{article.category?.nameKz || 'N/A'}</td>
                    <td className="p-2">
                      <span className="px-2 py-1 rounded text-xs bg-gray-200">
                        {article.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          article.published
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {article.published ? 'true' : 'false'}
                      </span>
                    </td>
                    <td className="p-2 text-sm">
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleString('ru-RU')
                        : 'null'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Нет статей в базе</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">
          Опубликованные статьи (published=true): {publishedArticles?.length || 0}
        </h2>
        <div className="bg-white shadow rounded-lg p-4">
          {publishedArticles && publishedArticles.length > 0 ? (
            <ul className="space-y-2">
              {publishedArticles.map((article: any) => (
                <li key={article.id} className="border-b pb-2">
                  <div className="font-medium">{article.titleKz}</div>
                  <div className="text-sm text-gray-600">
                    Категория: {article.category?.nameKz || 'N/A'} | Status: {article.status}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">
              Нет опубликованных статей (published=true)
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-bold mb-2">Инструкция:</h3>
        <p className="text-sm">
          Чтобы статья отображалась на главной странице:
        </p>
        <ol className="list-decimal list-inside text-sm mt-2 space-y-1">
          <li>
            Откройте статью на редактирование в{' '}
            <a href="/admin/articles" className="text-blue-600 underline">
              админ-панели
            </a>
          </li>
          <li>Найдите поле "Статус публикации"</li>
          <li>
            Измените статус с "Черновик" (DRAFT) на "Опубликовано" (PUBLISHED)
          </li>
          <li>Нажмите "Обновить статью"</li>
          <li>Статья появится на главной странице</li>
        </ol>
      </div>
    </div>
  );
}
