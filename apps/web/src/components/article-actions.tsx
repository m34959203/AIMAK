'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ArticleActionsProps {
  articleId: string;
  authorId: string;
  lang: 'kz' | 'ru';
}

export function ArticleActions({ articleId, authorId, lang }: ArticleActionsProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Show buttons only if user is logged in and is either admin or author
  if (!user || (user.role !== 'ADMIN' && user.id !== authorId)) {
    return null;
  }

  const handleDelete = async () => {
    if (!confirm(lang === 'kz' ? 'Мақаланы өшіруге сенімдісіз бе?' : 'Вы уверены, что хотите удалить эту статью?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert(lang === 'kz' ? 'Мақала сәтті өшірілді' : 'Статья успешно удалена');
        router.push(`/${lang}`);
      } else {
        alert(lang === 'kz' ? 'Қате орын алды' : 'Произошла ошибка');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      alert(lang === 'kz' ? 'Қате орын алды' : 'Произошла ошибка');
    }
  };

  return (
    <div className="flex gap-3 mt-6 pt-6 border-t">
      <Link
        href={`/admin/articles/${articleId}`}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        {lang === 'kz' ? '✏️ Өңдеу' : '✏️ Редактировать'}
      </Link>
      <button
        onClick={handleDelete}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        {lang === 'kz' ? '🗑️ Өшіру' : '🗑️ Удалить'}
      </button>
    </div>
  );
}
