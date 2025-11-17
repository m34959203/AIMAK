import { TengriArticleCard } from '@/components/tengri-article-card';

async function getArticles() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/articles?published=true`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return [];
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/categories`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export default async function HomePage({
  params,
}: {
  params: { lang: 'kz' | 'ru' };
}) {
  const [articles, categories] = await Promise.all([
    getArticles(),
    getCategories(),
  ]);

  const heroArticle = articles[0];
  const sidebarArticles = articles.slice(1, 6);
  const mainArticles = articles.slice(6, 16);
  const trendingArticles = articles.slice(16, 21);

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      {heroArticle && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <TengriArticleCard
              article={heroArticle}
              lang={params.lang}
              variant="hero"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Column - 8 cols */}
          <div className="lg:col-span-8">
            {/* Latest News */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {params.lang === 'kz' ? 'Соңғы жаңалықтар' : 'Последние новости'}
                </h2>
                <a
                  href={`/${params.lang}/zhanalyqtar`}
                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  {params.lang === 'kz' ? 'Барлығы' : 'Все'} →
                </a>
              </div>

              <div className="space-y-4">
                {mainArticles.map((article: any) => (
                  <TengriArticleCard
                    key={article.id}
                    article={article}
                    lang={params.lang}
                    variant="horizontal"
                  />
                ))}
              </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.slice(0, 4).map((category: any) => (
                <div key={category.id} className="bg-white rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">
                    {params.lang === 'kz' ? category.nameKz : category.nameRu}
                  </h3>
                  <div className="space-y-3">
                    {articles
                      .filter((a: any) => a.categoryId === category.id)
                      .slice(0, 3)
                      .map((article: any) => (
                        <div key={article.id}>
                          <a
                            href={`/${params.lang}/${category.slug}/${
                              params.lang === 'kz' ? article.slugKz : article.slugRu || article.slugKz
                            }`}
                            className="text-sm font-medium hover:text-green-600 line-clamp-2"
                          >
                            {params.lang === 'kz' ? article.titleKz : article.titleRu || article.titleKz}
                          </a>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar - 4 cols */}
          <aside className="lg:col-span-4">
            {/* Popular */}
            <div className="bg-white rounded-lg p-6 mb-6 sticky top-20">
              <h3 className="text-xl font-bold mb-4 border-b pb-3">
                {params.lang === 'kz' ? 'Танымал' : 'Популярное'}
              </h3>
              <div className="space-y-4">
                {sidebarArticles.map((article: any, index: number) => (
                  <div key={article.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-3xl font-bold text-gray-200">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={`/${params.lang}/${article.category?.slug}/${
                          params.lang === 'kz' ? article.slugKz : article.slugRu || article.slugKz
                        }`}
                        className="font-medium text-sm hover:text-green-600 line-clamp-3"
                      >
                        {params.lang === 'kz' ? article.titleKz : article.titleRu || article.titleKz}
                      </a>
                      <div className="text-xs text-gray-500 mt-1">
                        {article.views ? `👁️ ${article.views.toLocaleString()}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ad Space */}
            <div className="bg-gray-200 rounded-lg p-6 mb-6 flex items-center justify-center h-64">
              <span className="text-gray-400">
                {params.lang === 'kz' ? 'Жарнама' : 'Реклама'} 300x600
              </span>
            </div>

            {/* Trending */}
            {trendingArticles.length > 0 && (
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 border-b pb-3">
                  🔥 {params.lang === 'kz' ? 'Тренд' : 'В тренде'}
                </h3>
                <div className="space-y-3">
                  {trendingArticles.map((article: any) => (
                    <div key={article.id}>
                      <a
                        href={`/${params.lang}/${article.category?.slug}/${
                          params.lang === 'kz' ? article.slugKz : article.slugRu || article.slugKz
                        }`}
                        className="text-sm font-medium hover:text-green-600 line-clamp-2"
                      >
                        {params.lang === 'kz' ? article.titleKz : article.titleRu || article.titleKz}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Bottom Ad */}
      <div className="bg-white border-t border-b py-6">
        <div className="container mx-auto px-4">
          <div className="bg-gray-200 rounded-lg p-6 flex items-center justify-center h-24">
            <span className="text-gray-400">
              {params.lang === 'kz' ? 'Жарнама' : 'Реклама'} 970x90
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
