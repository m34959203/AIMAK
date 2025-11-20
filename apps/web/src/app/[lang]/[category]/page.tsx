import { TengriArticleCard } from '@/components/tengri-article-card';
import { getApiEndpoint } from '@/lib/api-url';

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

async function getCategoryArticles(categorySlug: string) {
  try {
    const apiEndpoint = getApiEndpoint('/articles', { published: true });

    const res = await fetch(apiEndpoint, { cache: 'no-store' });

    if (!res.ok) {
      console.error(`Failed to fetch articles: ${res.status} ${res.statusText}`);
      return [];
    }

    const allArticles = await res.json();

    if (!Array.isArray(allArticles)) {
      console.error('Invalid articles response format:', allArticles);
      return [];
    }

    console.log(`Total articles fetched: ${allArticles.length}`);
    const filtered = allArticles.filter((article: any) => article.category?.slug === categorySlug);
    console.log(`Articles in category '${categorySlug}': ${filtered.length}`);
    return filtered;
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return [];
  }
}

// Fallback categories if API is unavailable
const FALLBACK_CATEGORIES = [
  {
    slug: 'zhanalyqtar',
    nameKz: 'ЖАҢАЛЫҚТАР',
    nameRu: 'НОВОСТИ',
    descriptionKz: 'Сатпаев қаласы мен облысының соңғы жаңалықтары',
    descriptionRu: 'Последние новости города Сатпаев и области',
  },
  {
    slug: 'ozekti',
    nameKz: 'ӨЗЕКТІ',
    nameRu: 'АКТУАЛЬНО',
    descriptionKz: 'Өзекті мәселелер мен маңызды оқиғалар',
    descriptionRu: 'Актуальные вопросы и важные события',
  },
  {
    slug: 'sayasat',
    nameKz: 'САЯСАТ',
    nameRu: 'ПОЛИТИКА',
    descriptionKz: 'Саяси жаңалықтар және талдаулар',
    descriptionRu: 'Политические новости и аналитика',
  },
  {
    slug: 'madeniyet',
    nameKz: 'МӘДЕНИЕТ',
    nameRu: 'КУЛЬТУРА',
    descriptionKz: 'Мәдени оқиғалар, өнер және әдебиет',
    descriptionRu: 'Культурные события, искусство и литература',
  },
  {
    slug: 'qogam',
    nameKz: 'ҚОҒАМ',
    nameRu: 'ОБЩЕСТВО',
    descriptionKz: 'Қоғамдық өмір және әлеуметтік мәселелер',
    descriptionRu: 'Общественная жизнь и социальные вопросы',
  },
  {
    slug: 'kazakhmys',
    nameKz: 'KAZAKHMYS NEWS',
    nameRu: 'KAZAKHMYS NEWS',
    descriptionKz: 'Қазақмыс корпорациясы жаңалықтары',
    descriptionRu: 'Новости корпорации Казахмыс',
  },
];

async function getCategory(categorySlug: string) {
  try {
    const apiEndpoint = getApiEndpoint('/categories');

    const res = await fetch(apiEndpoint, { cache: 'no-store' });

    if (!res.ok) {
      console.error(`Failed to fetch categories: ${res.status} ${res.statusText}`);
      // Use fallback categories if API fails
      return FALLBACK_CATEGORIES.find((cat) => cat.slug === categorySlug) || null;
    }

    const categories = await res.json();

    if (!Array.isArray(categories)) {
      console.error('Invalid categories response format:', categories);
      return FALLBACK_CATEGORIES.find((cat) => cat.slug === categorySlug) || null;
    }

    return categories.find((cat: any) => cat.slug === categorySlug);
  } catch (error) {
    console.error('Failed to fetch category:', error);
    // Use fallback categories if API fails
    return FALLBACK_CATEGORIES.find((cat) => cat.slug === categorySlug) || null;
  }
}

export default async function CategoryPage({
  params,
}: {
  params: { lang: 'kz' | 'ru'; category: string };
}) {
  const [category, articles] = await Promise.all([
    getCategory(params.category),
    getCategoryArticles(params.category),
  ]);

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">
          {params.lang === 'kz' ? 'Санат табылмады' : 'Категория не найдена'}
        </h1>
      </div>
    );
  }

  const categoryName = params.lang === 'kz' ? category.nameKz : category.nameRu;
  const categoryDescription = params.lang === 'kz' ? category.descriptionKz : category.descriptionRu;

  const featuredArticles = articles.filter((a: any) => a.isFeatured).slice(0, 3);
  const regularArticles = articles.filter((a: any) => !a.isFeatured);

  return (
    <div className="bg-gray-50">
      {/* Category Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">{categoryName}</h1>
          {categoryDescription && (
            <p className="text-gray-600 text-lg">{categoryDescription}</p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content - 8 cols */}
          <div className="lg:col-span-8">
            {/* Featured Articles */}
            {featuredArticles.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6">
                  {params.lang === 'kz' ? 'Таңдаулы' : 'Избранное'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {featuredArticles.map((article: any) => (
                    <TengriArticleCard
                      key={article.id}
                      article={article}
                      lang={params.lang}
                      variant="vertical"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Articles */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6 border-b pb-4">
                {params.lang === 'kz' ? 'Барлық мақалалар' : 'Все статьи'}
              </h2>

              {regularArticles.length > 0 ? (
                <div className="space-y-4">
                  {regularArticles.map((article: any) => (
                    <TengriArticleCard
                      key={article.id}
                      article={article}
                      lang={params.lang}
                      variant="horizontal"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {params.lang === 'kz'
                    ? 'Бұл санатта әзірге мақалалар жоқ'
                    : 'В этой категории пока нет статей'}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - 4 cols */}
          <aside className="lg:col-span-4">
            {/* Popular in Category */}
            <div className="bg-white rounded-lg p-6 mb-6 sticky top-20">
              <h3 className="text-xl font-bold mb-4 border-b pb-3">
                {params.lang === 'kz' ? 'Танымал мақалалар' : 'Популярные статьи'}
              </h3>
              <div className="space-y-4">
                {articles
                  .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
                  .slice(0, 5)
                  .map((article: any, index: number) => (
                    <div key={article.id} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <span className="text-2xl font-bold text-gray-200">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <a
                          href={`/${params.lang}/${params.category}/${
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
