import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { Article } from '@/types';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {article.coverImage && (
        <div className="aspect-video bg-gray-200">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-500">
            {article.category.name}
          </span>
          <span className="text-gray-300">•</span>
          <span className="text-sm text-gray-500">
            {formatDate(article.publishedAt || article.createdAt)}
          </span>
        </div>
        <Link href={`/articles/${article.slug}`}>
          <h3 className="text-xl font-bold mb-2 hover:text-blue-600">
            {article.title}
          </h3>
        </Link>
        {article.excerpt && (
          <p className="text-gray-600 mb-4">{article.excerpt}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {article.author.firstName} {article.author.lastName}
          </div>
          <div className="flex gap-2">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="text-xs bg-gray-100 px-2 py-1 rounded"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
