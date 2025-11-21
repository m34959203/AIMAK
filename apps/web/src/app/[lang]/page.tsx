import { BreakingNewsBanner } from '@/components/breaking-news-banner';
import { MagazineHero } from '@/components/magazine-hero';
import { TrendingSection } from '@/components/trending-section';
import { TengriArticleCard } from '@/components/tengri-article-card';
import { Advertisement } from '@/components/advertisement';
import { getApiEndpoint } from '@/lib/api-url';

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

async function getArticles() {
  try {
    const apiEndpoint = getApiEndpoint('/articles', { published: true });

    console.log('Fetching articles from:', apiEndpoint);

    const res = await fetch(apiEndpoint, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch articles:', res.status, res.statusText);
      return [];
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error('Invalid articles response format:', data);
      return [];
    }

    console.log(`Successfully fetched ${data.length} articles`);
    return data;
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return [];
  }
}

async function getBreakingNews() {
  try {
    const apiEndpoint = getApiEndpoint('/articles', { published: true, isBreaking: true });

    console.log('Fetching breaking news from:', apiEndpoint);

    const res = await fetch(apiEndpoint, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch breaking news:', res.status, res.statusText);
      return null;
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    // Return the most recent breaking news
    return data[0];
  } catch (error) {
    console.error('Failed to fetch breaking news:', error);
    return null;
  }
}


export default async function HomePage({
  params,
}: {
  params: { lang: 'kz' | 'ru' };
}) {
  const articles = await getArticles();

  // Get breaking news from separate API call
  const breakingArticle = await getBreakingNews();

  // Articles for hero section
  const heroMainArticle = articles[0];
  const heroSideArticles = articles.slice(1, 3);

  // Articles for main feed
  const mainArticles = articles.slice(3, 13);

  // Trending articles (сортировка по просмотрам)
  const trendingArticles = [...articles]
    .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breaking News Banner */}
      {breakingArticle && (
        <BreakingNewsBanner
          lang={params.lang}
          article={breakingArticle}
        />
      )}

      {/* Magazine Hero Section */}
      {heroMainArticle && (
        <MagazineHero
          mainArticle={heroMainArticle}
          sideArticles={heroSideArticles}
          lang={params.lang}
        />
      )}

      {/* Top Advertisement */}
      <div className="container mx-auto px-4 py-4">
        <Advertisement
          position="HOME_TOP"
          className="w-full h-24 bg-gray-100 rounded-lg overflow-hidden"
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column - 8 cols */}
          <div className="lg:col-span-8 space-y-8">
            {/* Latest News Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-6 pb-4 border-b-2 border-green-500">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    {params.lang === 'kz' ? 'Соңғы жаңалықтар' : 'Последние новости'}
                  </h2>
                </div>
              </div>

              <div className="space-y-6">
                {mainArticles.map((article: any) => (
                  <div
                    key={article.id}
                    className="transform transition-all duration-300 hover:translate-x-2"
                  >
                    <TengriArticleCard
                      article={article}
                      lang={params.lang}
                      variant="horizontal"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - 4 cols */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Trending Section */}
            {trendingArticles.length > 0 && (
              <TrendingSection
                articles={trendingArticles}
                lang={params.lang}
              />
            )}

            {/* Ad Space */}
            <Advertisement
              position="HOME_SIDEBAR"
              className="w-full h-96 bg-gray-100 rounded-xl overflow-hidden"
            />

            {/* Social Media Links */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                {params.lang === 'kz' ? 'Әлеуметтік желілер' : 'Соцсети'}
              </h3>
              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                    📘
                  </div>
                  <span className="font-medium group-hover:text-blue-600">Facebook</span>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-white">
                    🐦
                  </div>
                  <span className="font-medium group-hover:text-sky-600">Twitter</span>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                    📷
                  </div>
                  <span className="font-medium group-hover:text-purple-600">Instagram</span>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    ✈️
                  </div>
                  <span className="font-medium group-hover:text-blue-600">Telegram</span>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h3 className="text-3xl font-bold mb-4">
              {params.lang === 'kz' ? 'Жаңалықтарға жазылу' : 'Подписка на новости'}
            </h3>
            <p className="mb-6 text-lg opacity-90">
              {params.lang === 'kz'
                ? 'Маңызды жаңалықтарды алғашқылардан болып біліңіз'
                : 'Будьте в курсе самых важных новостей'
              }
            </p>
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder={params.lang === 'kz' ? 'Email мекенжайыңыз' : 'Ваш email'}
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
                {params.lang === 'kz' ? 'Жазылу' : 'Подписаться'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
