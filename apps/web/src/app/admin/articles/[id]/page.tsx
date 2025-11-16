'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArticleForm } from '@/components/article-form';
import { useArticle, useUpdateArticle } from '@/hooks/use-articles';
import type { UpdateArticleDto } from '@/types';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: article, isLoading } = useArticle(id);
  const updateArticle = useUpdateArticle();

  const handleSubmit = (data: UpdateArticleDto) => {
    updateArticle.mutate(
      { id, data },
      {
        onSuccess: () => {
          router.push('/admin/articles');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center">Загрузка...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-red-600">Статья не найдена</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Редактировать статью</h1>

        {updateArticle.isError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Ошибка при обновлении статьи. Проверьте все поля.
          </div>
        )}

        <ArticleForm
          article={article}
          onSubmit={handleSubmit}
          isLoading={updateArticle.isPending}
        />
      </div>
    </div>
  );
}
