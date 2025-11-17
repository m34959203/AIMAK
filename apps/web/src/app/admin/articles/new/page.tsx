'use client';

import { useRouter } from 'next/navigation';
import { ArticleForm } from '@/components/article-form';
import { useCreateArticle } from '@/hooks/use-articles';
import type { CreateArticleDto, UpdateArticleDto } from '@/types';

export default function NewArticlePage() {
  const router = useRouter();
  const createArticle = useCreateArticle();

  const handleSubmit = (data: CreateArticleDto | UpdateArticleDto) => {
    createArticle.mutate(data as CreateArticleDto, {
      onSuccess: () => {
        router.push('/admin/articles');
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Создать статью</h1>

        {createArticle.isError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Ошибка при создании статьи. Проверьте все поля.
          </div>
        )}

        <ArticleForm
          onSubmit={handleSubmit}
          isLoading={createArticle.isPending}
        />
      </div>
    </div>
  );
}
