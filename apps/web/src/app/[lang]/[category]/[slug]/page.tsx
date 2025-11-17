import Image from 'next/image';
import { format } from 'date-fns';
import { kk, ru } from 'date-fns/locale';
import { TengriArticleCard } from '@/components/tengri-article-card';

async function getArticleBySlug(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/articles/slug/${slug}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Failed to fetch article:', error);
    return null;
  }
}

async function getRelatedArticles(categoryId: string, currentArticleId: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/articles?published=true`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      return [];
    }

    const articles = await res.json();
    return articles
      .filter((a: any) => a.categoryId === categoryId && a.id !== currentArticleId)
      .slice(0, 4);
  } catch (error) {
    console.error('Failed to fetch related articles:', error);
    return [];
  }
}

export default async function ArticlePage({
  params,
}: {
  params: { lang: 'kz' | 'ru'; category: string; slug: string };
}) {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">
          {params.lang === 'kz' ? 'Мақала табылмады' : 'Статья не найдена'}
        </h1>
      </div>
    );
  }

  const relatedArticles = await getRelatedArticles(article.categoryId, article.id);

  const title = params.lang === 'kz' ? article.titleKz : article.titleRu || article.titleKz;
  const content = params.lang === 'kz' ? article.contentKz : article.contentRu || article.contentKz;
  const excerpt = params.lang === 'kz' ? article.excerptKz : article.excerptRu || article.excerptKz;
  const categoryName = article.category
    ? params.lang === 'kz'
      ? article.category.nameKz
      : article.category.nameRu
    : '';

  const publishDate = article.publishedAt
    ? format(new Date(article.publishedAt), 'dd MMMM yyyy, HH:mm', {
        locale: params.lang === 'kz' ? kk : ru,
      })
    : '';

  return (
    <div className="bg-gray-50">
      {/* Article Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <a href={`/${params.lang}`} className="hover:text-green-600">
                {params.lang === 'kz' ? 'Басты бет' : 'Главная'}
              </a>
              <span>/</span>
              <a href={`/${params.lang}/${params.category}`} className="hover:text-green-600">
                {categoryName}
              </a>
            </div>

            {/* Category Badge */}
            {article.category && (
              <div className="mb-4">
                <a
                  href={`/${params.lang}/${params.category}`}
                  className="inline-block px-3 py-1 bg-green-600 text-white text-xs font-bold uppercase rounded hover:bg-green-700"
                >
                  {categoryName}
                </a>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {title}
            </h1>

            {/* Excerpt */}
            {excerpt && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-6 text-sm text-gray-600 border-t border-b py-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {article.author?.firstName} {article.author?.lastName}
                </span>
              </div>
              <span>{publishDate}</span>
              {article.views && (
                <span className="flex items-center gap-1">
                  👁️ {article.views.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content - 8 cols */}
          <article className="lg:col-span-8">
            <div className="bg-white rounded-lg p-8 mb-6">
              {/* Featured Image */}
              {article.coverImage && (
                <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
                  <Image
                    src={article.coverImage}
                    alt={title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="prose prose-lg max-w-none">
                <div
                  dangerouslySetInnerHTML={{ __html: content }}
                  className="article-content"
                />
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag: any) => (
                      <a
                        key={tag.id}
                        href={`/${params.lang}/tag/${tag.slug}`}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full"
                      >
                        #{params.lang === 'kz' ? tag.nameKz : tag.nameRu}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Buttons */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">
                  {params.lang === 'kz' ? 'Бөлісу' : 'Поделиться'}
                </h3>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Facebook
                  </button>
                  <button className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">
                    Twitter
                  </button>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Telegram
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">
                  {params.lang === 'kz' ? 'Ұқсас мақалалар' : 'Похожие статьи'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedArticles.map((relatedArticle: any) => (
                    <TengriArticleCard
                      key={relatedArticle.id}
                      article={relatedArticle}
                      lang={params.lang}
                      variant="vertical"
                    />
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar - 4 cols */}
          <aside className="lg:col-span-4">
            {/* Popular */}
            <div className="bg-white rounded-lg p-6 mb-6 sticky top-20">
              <h3 className="text-xl font-bold mb-4 border-b pb-3">
                {params.lang === 'kz' ? 'Танымал' : 'Популярное'}
              </h3>
              <div className="space-y-4">
                {relatedArticles.slice(0, 5).map((related: any, index: number) => (
                  <div key={related.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl font-bold text-gray-200">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={`/${params.lang}/${params.category}/${
                          params.lang === 'kz' ? related.slugKz : related.slugRu || related.slugKz
                        }`}
                        className="font-medium text-sm hover:text-green-600 line-clamp-3"
                      >
                        {params.lang === 'kz' ? related.titleKz : related.titleRu || related.titleKz}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ad Space */}
            <div className="bg-gray-200 rounded-lg p-6 flex items-center justify-center h-64">
              <span className="text-gray-400">
                {params.lang === 'kz' ? 'Жарнама' : 'Реклама'} 300x600
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
